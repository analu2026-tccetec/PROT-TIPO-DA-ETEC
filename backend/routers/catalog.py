"""Catálogo público: bairros, categorias, lojas e produtos."""

import re
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from lib.cosmopolis import CATEGORIES, NEIGHBORHOODS
from lib.db import db
from models.shop import CategoryOut, NeighborhoodOut, Product, ProductDetail, Store

catalog_router = APIRouter()

SORTS = {
    "novidades": [("created_at", -1)],
    "preco_asc": [("price", 1)],
    "preco_desc": [("price", -1)],
}


@catalog_router.get("/neighborhoods", response_model=List[NeighborhoodOut])
async def list_neighborhoods():
    return NEIGHBORHOODS


@catalog_router.get("/categories", response_model=List[CategoryOut])
async def list_categories():
    return CATEGORIES


@catalog_router.get("/stores", response_model=List[Store])
async def list_stores(store_type: Optional[str] = None, category_id: Optional[str] = None):
    query: dict = {}
    if store_type:
        query["store_type"] = store_type
    if category_id:
        query["category_id"] = category_id
    docs = await db.stores.find(query).sort("rating", -1).to_list(200)
    return [Store(**d) for d in docs]


@catalog_router.get("/stores/{slug}", response_model=Store)
async def get_store(slug: str):
    doc = await db.stores.find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    return Store(**doc)


@catalog_router.get("/products", response_model=List[Product])
async def list_products(
    store_id: Optional[str] = None,
    category_id: Optional[str] = None,
    q: Optional[str] = None,
    featured: bool = False,
    sort: str = "novidades",
    limit: int = 60,
):
    query: dict = {"available": True}
    if store_id:
        query["store_id"] = store_id
    if category_id:
        query["category_id"] = category_id
    if featured:
        query["featured"] = True
    if q:
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        query["$or"] = [{"name": rx}, {"description": rx}]
    docs = (
        await db.products.find(query)
        .sort(SORTS.get(sort, SORTS["novidades"]))
        .to_list(min(max(limit, 1), 100))
    )
    return [Product(**d) for d in docs]


@catalog_router.get("/products/{product_id}", response_model=ProductDetail)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    store_doc = await db.stores.find_one({"id": doc.get("store_id")})
    doc["store"] = Store(**store_doc) if store_doc else None
    return ProductDetail(**doc)
