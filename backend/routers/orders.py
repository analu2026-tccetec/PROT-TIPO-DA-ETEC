"""Pedidos: checkout de visitante (guest), frete por bairro e confirmação de Pix simulado."""

import uuid
from typing import List

from fastapi import APIRouter, HTTPException

from lib.cosmopolis import NEIGHBORHOODS, neighborhood_surcharge
from lib.db import db
from models.shop import CheckoutRequest, Order, OrderItem, ShippingLine, Store

orders_router = APIRouter()


def store_shipping_fee(store: Store, surcharge: float, store_subtotal: float, pickup: bool) -> float:
    """Regra de frete: retirada zera; acima do mínimo da loja é grátis; senão taxa fixa + bairro."""
    if pickup:
        return 0.0
    if store.free_delivery_min > 0 and store_subtotal >= store.free_delivery_min:
        return 0.0
    return round(store.delivery_fee + surcharge, 2)


@orders_router.post("/orders", response_model=Order, status_code=201)
async def create_order(payload: CheckoutRequest):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Carrinho vazio")

    ids = [i.product_id for i in payload.items]
    docs = await db.products.find({"id": {"$in": ids}}).to_list(100)
    by_id = {d["id"]: d for d in docs}

    items: List[OrderItem] = []
    subtotals: dict[str, float] = {}
    stores: dict[str, Store] = {}

    for item in payload.items:
        p = by_id.get(item.product_id)
        if not p or not p.get("available", True):
            raise HTTPException(status_code=400, detail="Produto indisponível no catálogo")
        if p["stock"] < item.quantity:
            raise HTTPException(status_code=409, detail=f"Estoque insuficiente para {p['name']}")

        store = stores.get(p["store_id"])
        if store is None:
            sdoc = await db.stores.find_one({"id": p["store_id"]})
            if not sdoc:
                raise HTTPException(status_code=400, detail="Loja do produto não encontrada")
            store = Store(**sdoc)
            stores[store.id] = store

        items.append(
            OrderItem(
                product_id=p["id"],
                store_id=store.id,
                store_name=store.name,
                name=p["name"],
                price=p["price"],
                quantity=item.quantity,
                image_url=p.get("image_url", ""),
            )
        )
        subtotals[store.id] = round(subtotals.get(store.id, 0.0) + p["price"] * item.quantity, 2)

    # Regras por loja: pedido mínimo
    for store_id, subtotal in subtotals.items():
        store = stores[store_id]
        if store.min_order > 0 and subtotal < store.min_order:
            raise HTTPException(
                status_code=400,
                detail=f"Pedido mínimo da loja {store.name}: R$ {store.min_order:.2f}".replace(".", ","),
            )

    pickup = payload.pickup
    if pickup:
        no_pickup = [s.name for s in stores.values() if not s.pickup_available]
        if no_pickup:
            raise HTTPException(
                status_code=400,
                detail=f"Retirada indisponível em: {', '.join(no_pickup)}",
            )

    surcharge = 0.0
    neighborhood = payload.neighborhood
    if not pickup:
        surcharge = neighborhood_surcharge(payload.neighborhood)  # type: ignore[assignment]
        if surcharge is None:
            raise HTTPException(status_code=400, detail="Bairro de entrega inválido")
        if not payload.address.strip():
            raise HTTPException(status_code=400, detail="Informe o endereço de entrega")
    else:
        neighborhood = "Retirada na loja"

    breakdown = [
        ShippingLine(
            store_id=sid,
            store_name=stores[sid].name,
            fee=store_shipping_fee(stores[sid], surcharge, subtotals[sid], pickup),
        )
        for sid in subtotals
    ]
    subtotal = round(sum(subtotals.values()), 2)
    shipping_total = round(sum(l.fee for l in breakdown), 2)
    total = round(subtotal + shipping_total, 2)

    payment_method = payload.payment_method
    payment_status = {"pix": "aguardando", "card": "pago", "delivery": "na_entrega"}[payment_method]
    status = "preparando" if payment_method in ("card", "delivery") else "aguardando_pagamento"
    pix_txid = ("SIM" + uuid.uuid4().hex[:10]).upper() if payment_method == "pix" else None

    order = Order(
        code=("VC-" + uuid.uuid4().hex[:6]).upper(),
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        neighborhood=neighborhood,
        address=payload.address.strip(),
        pickup=pickup,
        payment_method=payment_method,
        payment_status=payment_status,
        status=status,
        items=items,
        subtotal=subtotal,
        shipping_total=shipping_total,
        total=total,
        shipping_breakdown=breakdown,
        pix_txid=pix_txid,
    )
    await db.orders.insert_one(order.model_dump())

    for item in payload.items:
        res = await db.products.update_one(
            {"id": item.product_id, "stock": {"$gte": item.quantity}},
            {"$inc": {"stock": -item.quantity}},
        )
        if res.modified_count == 0:
            await db.orders.delete_one({"id": order.id})
            raise HTTPException(status_code=409, detail="Estoque acabou de esgotar para um dos itens")
    return order


@orders_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    doc = await db.orders.find_one({"id": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return Order(**doc)


@orders_router.post("/orders/{order_id}/pay", response_model=Order)
async def confirm_pix_payment(order_id: str):
    """Simulação de confirmação de Pix: nenhum pagamento real é processado."""
    doc = await db.orders.find_one({"id": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if doc["payment_method"] != "pix" or doc["payment_status"] != "aguardando":
        raise HTTPException(status_code=400, detail="Este pedido não aguarda pagamento via Pix")
    await db.orders.update_one(
        {"id": order_id}, {"$set": {"payment_status": "pago", "status": "preparando"}}
    )
    fresh = await db.orders.find_one({"id": order_id})
    return Order(**fresh)
