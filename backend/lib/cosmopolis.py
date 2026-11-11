"""Constantes da cidade: bairros de Cosmópolis-SP, categorias do catálogo e imagens padrão.

O frete é composto por duas camadas:
- a taxa fixa de cada loja (`store.delivery_fee`, editável pelo lojista no painel);
- o adicional por distância do bairro de entrega (`NEIGHBORHOODS[n]["surcharge"]`).
Retirada na loja (Click & Collect) zera o frete.
"""

U = "?q=80&w=800&auto=format&fit=crop"

NEIGHBORHOODS = [
    {"name": "Centro", "surcharge": 0.0, "prazo": "30–50 min"},
    {"name": "Vila Nova", "surcharge": 1.0, "prazo": "30–50 min"},
    {"name": "Betel", "surcharge": 1.5, "prazo": "35–55 min"},
    {"name": "Cidade Moça", "surcharge": 1.5, "prazo": "35–55 min"},
    {"name": "Parque Residencial Itapavussu", "surcharge": 2.0, "prazo": "40–60 min"},
    {"name": "Bela Vista", "surcharge": 2.0, "prazo": "35–55 min"},
    {"name": "Jardim das Paineiras", "surcharge": 2.5, "prazo": "40–60 min"},
    {"name": "Jardim Santana", "surcharge": 2.5, "prazo": "40–60 min"},
    {"name": "Observatório", "surcharge": 3.0, "prazo": "45–65 min"},
]

CATEGORIES = [
    {"id": "hortifruti", "name": "Supermercado & Hortifrúti", "icon": "Apple", "badge": "Fresquinho"},
    {"id": "moda", "name": "Moda & Acessórios", "icon": "Shirt", "badge": "Tendências"},
    {"id": "beleza", "name": "Beleza & Cosméticos", "icon": "Sparkles", "badge": "Cuidados"},
    {"id": "casa", "name": "Casa & Decoração", "icon": "Lamp", "badge": "Artesanal"},
    {"id": "eletronicos", "name": "Eletrônicos & Acessórios", "icon": "Smartphone", "badge": "Garantia local"},
    {"id": "artesanato", "name": "Artesanato & Feito à Mão", "icon": "Scissors", "badge": "Feito à mão"},
    {"id": "servicos", "name": "Serviços Locais", "icon": "Wrench", "badge": "Agendamento"},
]

# Imagem padrão por categoria, usada quando o lojista não cadastra foto.
PLACEHOLDER_IMAGES = {
    "hortifruti": f"https://images.unsplash.com/photo-1542838132-92c53300491e{U}",
    "moda": f"https://images.unsplash.com/photo-1441986300917-64674bd600d8{U}",
    "beleza": f"https://images.unsplash.com/photo-1596462502278-27bfdc403348{U}",
    "casa": f"https://images.unsplash.com/photo-1583753075968-1236ccb83c66{U}",
    "eletronicos": f"https://images.unsplash.com/photo-1498049794561-7780e7231661{U}",
    "artesanato": f"https://images.unsplash.com/photo-1506806732259-39c2d0268443{U}",
    "servicos": f"https://images.unsplash.com/photo-1615655406736-b37c4fabf923{U}",
}


def neighborhood_surcharge(name: str) -> float | None:
    for n in NEIGHBORHOODS:
        if n["name"] == name:
            return n["surcharge"]
    return None
