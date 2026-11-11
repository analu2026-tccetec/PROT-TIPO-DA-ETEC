"""Modelos Pydantic v2 do marketplace Vitrine Cosmópolis.

Cada modelo aqui tem um espelho manual em frontend/src/lib/types.ts — mantenha os
dois em sincronia na MESMA edição.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


def new_id() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Datetime aware em UTC — BSON grava UTC; o offset garante parse correto no JS."""
    return datetime.now(timezone.utc)


class UtcRead(BaseModel):
    """Motor devolve datetimes naive (BSON = UTC). Normalizamos na leitura para
    que o Pydantic serialise com offset e o `new Date(...)` do JS parseie certo."""

    @field_validator("created_at", mode="before", check_fields=False)
    @classmethod
    def _normalize_utc(cls, v: object) -> object:
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


class NeighborhoodOut(BaseModel):
    name: str
    surcharge: float = 0.0
    prazo: str = ""


class CategoryOut(BaseModel):
    id: str
    name: str
    icon: str
    badge: str


class Store(UtcRead):
    id: str = Field(default_factory=new_id)
    slug: str
    name: str
    category_id: str
    store_type: Literal["pequeno_negocio", "loja_ancora"] = "pequeno_negocio"
    tagline: str = ""
    description: str = ""
    image_url: str = ""
    neighborhood: str = "Centro"
    address: str = ""
    phone: str = ""
    rating: float = 5.0
    reviews_count: int = 0
    delivery_fee: float = Field(5.0, ge=0)
    free_delivery_min: float = Field(0.0, ge=0)  # 0 = frete nunca é grátis
    min_order: float = Field(0.0, ge=0)
    pickup_available: bool = True
    opening_hours: str = "Seg a Sáb, 8h às 18h"
    is_open: bool = True
    verified: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class StoreUpdate(BaseModel):
    tagline: Optional[str] = None
    description: Optional[str] = None
    delivery_fee: Optional[float] = Field(None, ge=0)
    free_delivery_min: Optional[float] = Field(None, ge=0)
    min_order: Optional[float] = Field(None, ge=0)
    pickup_available: Optional[bool] = None
    opening_hours: Optional[str] = None
    is_open: Optional[bool] = None


class Product(UtcRead):
    id: str = Field(default_factory=new_id)
    store_id: str
    category_id: str
    name: str
    description: str = ""
    price: float = Field(gt=0)
    image_url: str = ""
    stock: int = Field(0, ge=0)
    unit: str = "un"
    featured: bool = False
    available: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = ""
    price: float = Field(gt=0)
    stock: int = Field(0, ge=0)
    image_url: str = ""
    unit: str = "un"
    featured: bool = False
    available: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    unit: Optional[str] = None
    featured: Optional[bool] = None
    available: Optional[bool] = None


class ProductDetail(Product):
    store: Optional[Store] = None


class ShippingLine(BaseModel):
    store_id: str
    store_name: str
    fee: float


class OrderItem(BaseModel):
    product_id: str
    store_id: str
    store_name: str
    name: str
    price: float
    quantity: int = Field(ge=1)
    image_url: str = ""


class Order(UtcRead):
    id: str = Field(default_factory=new_id)
    code: str = ""
    customer_name: str
    customer_phone: str
    neighborhood: str = ""
    address: str = ""
    pickup: bool = False
    payment_method: Literal["pix", "card", "delivery"]
    payment_status: Literal["aguardando", "pago", "na_entrega"] = "aguardando"
    status: Literal[
        "aguardando_pagamento", "preparando", "saiu_para_entrega", "entregue", "cancelado"
    ] = "aguardando_pagamento"
    items: List[OrderItem]
    subtotal: float
    shipping_total: float
    total: float
    shipping_breakdown: List[ShippingLine] = []
    pix_txid: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


class CheckoutItem(BaseModel):
    product_id: str
    quantity: int = Field(1, ge=1, le=50)


class CheckoutRequest(BaseModel):
    customer_name: str = Field(min_length=3)
    customer_phone: str = Field(min_length=8)
    neighborhood: str = ""
    address: str = ""
    pickup: bool = False
    payment_method: Literal["pix", "card", "delivery"]
    items: List[CheckoutItem] = Field(min_length=1)


class OrderStatusUpdate(BaseModel):
    status: Literal["preparando", "saiu_para_entrega", "entregue", "cancelado"]


class LeadCreate(BaseModel):
    business_name: str = Field(min_length=2, max_length=120)
    owner_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=30)
    category_id: str = "hortifruti"
    neighborhood: str = "Centro"
    message: str = Field("", max_length=600)


class Lead(UtcRead):
    id: str = Field(default_factory=new_id)
    created_at: datetime = Field(default_factory=utc_now)
    business_name: str
    owner_name: str
    phone: str
    category_id: str
    neighborhood: str
    message: str = ""
