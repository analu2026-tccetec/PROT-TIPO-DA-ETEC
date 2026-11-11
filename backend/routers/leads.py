"""Leads do onboarding de lojistas ("Seja um Parceiro")."""

from fastapi import APIRouter, status

from lib.db import db
from models.shop import Lead, LeadCreate

leads_router = APIRouter()


@leads_router.post("/leads", response_model=Lead, status_code=status.HTTP_201_CREATED)
async def create_lead(payload: LeadCreate):
    lead = Lead(**payload.model_dump())
    await db.leads.insert_one(lead.model_dump())
    return lead
