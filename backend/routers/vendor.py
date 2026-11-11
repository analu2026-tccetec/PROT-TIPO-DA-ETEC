"""Painel do lojista — modo demonstração, sem login (escolha do usuário).

Todas as rotas são escopadas por `store_id` no caminho: o painel só edita produtos e
pedidos da loja selecionada. Numa versão com login, o store_id viria da sessão.
"""

from typing import List

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from lib.db import db
from models.shop import (
    Order,
    OrderStatusUpdate,
    Product,
    ProductCreate,
    ProductUpdate,
    Store,
    StoreUpdate,
)

vendor_router = APIRouter(prefix="/vendor")


async def _store_or_404(store_id: str) -> Store:
    doc = await db.stores.find_one({"id": store_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    return Store(**doc)


@vendor_router.get("/stores", response_model=List[Store])
async def list_vendor_stores():
    docs = await db.stores.find().sort("name", 1).to_list(200)
    return [Store(**d) for d in docs]


@vendor_router.get("/{store_id}/products", response_model=List[Product])
async def list_store_products(store_id: str):
    await _store_or_404(store_id)
    docs = await db.products.find({"store_id": store_id}).sort("created_at", -1).to_list(200)
    return [Product(**d) for d in docs]


@vendor_router.post("/{store_id}/products", response_model=Product, status_code=201)
async def create_store_product(store_id: str, payload: ProductCreate):
    store = await _store_or_404(store_id)
    product = Product(
        store_id=store.id,
        category_id=store.category_id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        image_url=payload.image_url,
        stock=payload.stock,
        unit=payload.unit,
        featured=payload.featured,
        available=payload.available,
    )
    await db.products.insert_one(product.model_dump())
    return product


@vendor_router.patch("/{store_id}/products/{product_id}", response_model=Product)
async def update_store_product(store_id: str, product_id: str, payload: ProductUpdate):
    await _store_or_404(store_id)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    res = await db.products.find_one_and_update(
        {"id": product_id, "store_id": store_id},
        {"$set": changes},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise HTTPException(status_code=404, detail="Produto não encontrado nesta loja")
    return Product(**res)


@vendor_router.delete("/{store_id}/products/{product_id}", status_code=204)
async def delete_store_product(store_id: str, product_id: str):
    await _store_or_404(store_id)
    res = await db.products.delete_one({"id": product_id, "store_id": store_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado nesta loja")


@vendor_router.get("/{store_id}/orders", response_model=List[Order])
async def list_store_orders(store_id: str):
    await _store_or_404(store_id)
    docs = (
        await db.orders.find({"items.store_id": store_id})
        .sort("created_at", -1)
        .to_list(100)
    )
    return [Order(**d) for d in docs]


@vendor_router.patch("/{store_id}/orders/{order_id}", response_model=Order)
async def update_order_status(store_id: str, order_id: str, payload: OrderStatusUpdate):
    await _store_or_404(store_id)
    doc = await db.orders.find_one({"id": order_id, "items.store_id": store_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido não encontrado nesta loja")

    updates: dict = {"status": payload.status}
    if payload.status == "entregue" and doc.get("payment_method") == "delivery":
        updates["payment_status"] = "pago"  # pago na entrega, na entrega
    if payload.status == "cancelado":
        for item in doc.get("items", []):  # devolve o estoque
            await db.products.update_one(
                {"id": item["product_id"]}, {"$inc": {"stock": item["quantity"]}}
            )
    await db.orders.update_one({"id": order_id}, {"$set": updates})
    fresh = await db.orders.find_one({"id": order_id})
    return Order(**fresh)


@vendor_router.patch("/{store_id}", response_model=Store)
async def update_store(store_id: str, payload: StoreUpdate):
    await _store_or_404(store_id)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    await db.stores.update_one({"id": store_id}, {"$set": changes})
    fresh = await db.stores.find_one({"id": store_id})
    return Store(**fresh)
