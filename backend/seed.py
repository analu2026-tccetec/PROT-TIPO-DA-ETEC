"""Seed do marketplace Vitrine Cosmópolis.

Idempotente e sem deleções: cada documento usa id fixo e é gravado com
replace_one(upsert=True). Rode `cd /app/backend && python seed.py`.
"""

import asyncio
from datetime import timedelta

from lib.cosmopolis import U
from lib.db import client, db, ensure_indexes
from models.shop import Store, utc_now

img = lambda pid: f"https://images.unsplash.com/{pid}{U}"

STORES = [
    dict(id="st-hortifruti-emporio", slug="hortifruti-emporio", name="Hortifrúti & Empório da Terra",
         category_id="hortifruti", store_type="pequeno_negocio",
         tagline="Frutas, legumes e verduras colhidas na região, entregues no mesmo dia.",
         description="Empório de bairro no Centro de Cosmópolis com hortifrúti diário, queijos e geleiras artesanais.",
         image_url=img("photo-1550989460-0adf9ea622e2"), neighborhood="Centro", address="Rua XV de Novembro, 220 — Centro",
         phone="551935001010", rating=4.9, reviews_count=128, delivery_fee=4.90, free_delivery_min=60,
         min_order=20, pickup_available=True, opening_hours="Seg a Sáb, 7h30 às 19h"),
    dict(id="st-padaria-vila-real", slug="padaria-vila-real", name="Padaria Vila Real",
         category_id="hortifruti", store_type="pequeno_negocio",
         tagline="Pão quentinho, sonho e bolo caseiro todos os dias.",
         description="A padaria do quarteirão: pão francês na hora, confeitaria e cafés. Entrega quentinha na cidade.",
         image_url=img("photo-1568254183919-78a4f43a2877"), neighborhood="Centro", address="Rua Antônio Aleixo Real, 45 — Centro",
         phone="551935002020", rating=4.8, reviews_count=210, delivery_fee=3.90, free_delivery_min=45,
         min_order=15, pickup_available=True, opening_hours="Todos os dias, 6h às 20h"),
    dict(id="st-supermercado-avenida", slug="supermercado-avenida", name="Supermercados Avenida Central",
         category_id="hortifruti", store_type="loja_ancora",
         tagline="O maior catálogo de alimentos, bebidas e limpeza da cidade.",
         description="Loja âncora com atendimento em toda Cosmópolis: mercearia, açougue, frios, hortifrúti e limpeza.",
         image_url=img("photo-1670684684445-a4504dca0bbc"), neighborhood="Centro", address="Av. Dr. Plácido Rocha, 1500 — Centro",
         phone="551935003030", rating=4.7, reviews_count=430, delivery_fee=6.90, free_delivery_min=120,
         min_order=50, pickup_available=False, opening_hours="Todos os dias, 7h às 22h"),
    dict(id="st-atelie-moda", slug="atelie-moda", name="Ateliê & Moda Autoral Cosmopolense",
         category_id="moda", store_type="pequeno_negocio",
         tagline="Roupas e costuras feitas à mão por artesãs de Cosmópolis.",
         description="Peças autorais, bordados e ajustes sob medida. Cada pedido sai direto do ateliê no Betel.",
         image_url=img("photo-1767968037382-8eb9c564339f"), neighborhood="Betel", address="Rua Sete de Setembro, 310 — Betel",
         phone="551935004040", rating=5.0, reviews_count=84, delivery_fee=5.90, free_delivery_min=0,
         min_order=0, pickup_available=True, opening_hours="Seg a Sex, 9h às 18h"),
    dict(id="st-magazine-estilo", slug="magazine-estilo", name="Magazine Estilo Cidade",
         category_id="moda", store_type="loja_ancora",
         tagline="Moda para toda a família, com provador e retirada rápida.",
         description="Rede regional de moda: feminino, masculino e infantil com coleções semanais.",
         image_url=img("photo-1441986300917-64674bd600d8"), neighborhood="Centro", address="Av. Barão de Ataliba, 88 — Centro",
         phone="551935005050", rating=4.6, reviews_count=356, delivery_fee=7.90, free_delivery_min=150,
         min_order=0, pickup_available=False, opening_hours="Seg a Sáb, 9h às 21h"),
    dict(id="st-boutique-essencia", slug="boutique-essencia", name="Boutique Essência & Beleza",
         category_id="beleza", store_type="pequeno_negocio",
         tagline="Perfumes, skincare e maquiagem com pronta-entrega.",
         description="Perfumaria e dermocosméticos selecionados, com consultoria da proprietária por WhatsApp.",
         image_url=img("photo-1583209814683-c023dd293cc6"), neighborhood="Vila Nova", address="Rua Benjamin Constant, 77 — Vila Nova",
         phone="551935006060", rating=4.8, reviews_count=62, delivery_fee=4.90, free_delivery_min=80,
         min_order=0, pickup_available=True, opening_hours="Ter a Sáb, 9h às 18h"),
    dict(id="st-farmacia-saude-ja", slug="farmacia-saude-ja", name="Farmácias Saúde Já",
         category_id="beleza", store_type="loja_ancora",
         tagline="Medicamentos, dermocosméticos e bem-estar com entrega expressa.",
         description="Rede de farmácias com atendimento farmacêutico e entrega rápida em todos os bairros.",
         image_url=img("photo-1522335789203-aabd1fc54bc9"), neighborhood="Centro", address="Rua Campos Sales, 500 — Centro",
         phone="551935007070", rating=4.5, reviews_count=298, delivery_fee=5.90, free_delivery_min=90,
         min_order=0, pickup_available=True, opening_hours="Todos os dias, 8h às 22h"),
    dict(id="st-cosmopolis-tech", slug="cosmopolis-tech", name="Cosmópolis Tech & Celulares",
         category_id="eletronicos", store_type="loja_ancora",
         tagline="Acessórios, fones e assistência com garantia local.",
         description="Assistência técnica autorizada e acessórios de celular, com entrega no mesmo dia em Itapavussu.",
         image_url=img("photo-1498049794561-7780e7231661"), neighborhood="Parque Residencial Itapavussu",
         address="Av. Brasil, 2000 — Pq. Residencial Itapavussu", phone="551935008080", rating=4.6,
         reviews_count=210, delivery_fee=7.90, free_delivery_min=200, min_order=30, pickup_available=False,
         opening_hours="Seg a Sáb, 9h às 19h"),
    dict(id="st-casa-cia", slug="casa-cia", name="Casa & Cia Decorações",
         category_id="casa", store_type="pequeno_negocio",
         tagline="Plantas, vasos e decoração para deixar a casa sua.",
         description="Decoração artesanal, plantas ornamentais e presentes com embalagem para lembrancinha.",
         image_url=img("photo-1632323187625-7a4e4414338e"), neighborhood="Bela Vista", address="Rua Mato Grosso, 612 — Bela Vista",
         phone="551935009090", rating=4.9, reviews_count=74, delivery_fee=5.50, free_delivery_min=100,
         min_order=0, pickup_available=True, opening_hours="Seg a Sáb, 9h às 18h"),
    dict(id="st-vila-artesa", slug="vila-artesa", name="Vila Artesã Cosmópolis",
         category_id="artesanato", store_type="pequeno_negocio",
         tagline="Feito à mão, feito em Cosmópolis.",
         description="Coletivo de artesãs locais: cestaria, cerâmica, tear e bijuterias exclusivas.",
         image_url=img("photo-1506806732259-39c2d0268443"), neighborhood="Observatório", address="Rua Berta Lopes, 33 — Observatório",
         phone="551935010010", rating=4.9, reviews_count=96, delivery_fee=5.90, free_delivery_min=0,
         min_order=0, pickup_available=True, opening_hours="Qua a Dom, 9h às 17h"),
    dict(id="st-multiservicos", slug="multiservicos", name="MultiServiços Cosmópolis",
         category_id="servicos", store_type="pequeno_negocio",
         tagline="Prestadores locais verificados para a sua casa.",
         description="Rede de prestadores: reparos, instalações e beleza a domicílio, com profissionais verificados.",
         image_url=img("photo-1757085242652-f8cd4d3de889"), neighborhood="Centro", address="Atendimento em toda a cidade",
         phone="551935011011", rating=4.7, reviews_count=58, delivery_fee=4.90, free_delivery_min=0,
         min_order=0, pickup_available=False, opening_hours="Seg a Sáb, 8h às 18h"),
]

P = []  # (id, store_id, name, description, price, image, stock, unit, featured)
def p(pid, sid, name, desc, price, image, stock, unit="un", featured=False):
    P.append(dict(id=pid, store_id=sid, name=name, description=desc, price=price,
                  image_url=image, stock=stock, unit=unit, featured=featured))

# Hortifrúti & Empório da Terra
p("pr-banana-prata", "st-hortifruti-emporio", "Banana Prata fresca",
  "Banana prata colhida no sítio da região, doce e madura no ponto.", 6.49,
  img("photo-1750601455197-a7ba46fb1544"), 50, "kg", True)
p("pr-tomate-italiano", "st-hortifruti-emporio", "Tomate Italiano",
  "Tomate italiano firme, ideal para saladas e molhos.", 8.90,
  img("photo-1542838132-92c53300491e"), 40, "kg")
p("pr-alface-crespa", "st-hortifruti-emporio", "Alface Crespa",
  "Alface crespa hidropônica, colhida no dia.", 3.50,
  img("photo-1488459716781-31db52582fe9"), 25)
p("pr-cesta-frutas", "st-hortifruti-emporio", "Cesta Semanal de Frutas",
  "Cesta com 2 kg de frutas da estação selecionadas pelo empresário.", 39.90,
  img("photo-1609780447631-05b93e5a88ea"), 15, "cesta", True)
p("pr-ovos-caipira", "st-hortifruti-emporio", "Ovos Caipiras",
  "Dúzia de ovos caipiras de granjas familiares da região.", 14.90,
  img("photo-1550989460-0adf9ea622e2"), 30, "dúzia")

# Padaria Vila Real
p("pr-pao-frances", "st-padaria-vila-real", "Pão Francês quentinho",
  "Saído do forno a cada meia hora — crocante por fora, macio por dentro.", 16.90,
  img("photo-1483695028939-5bb13f8648b0"), 60, "kg", True)
p("pr-sonho", "st-padaria-vila-real", "Sonho de Padaria",
  "Sonho recheado com creme de baunilha, polvilhado com açúcar.", 5.50,
  img("photo-1534432182912-63863115e106"), 24)
p("pr-bolo-fuba", "st-padaria-vila-real", "Bolo Caseiro de Fubá",
  "Bolo de fubá com goiabada, receita da vovó Cida. Serve até 8 fatias.", 28.00,
  img("photo-1568254183919-78a4f43a2877"), 10, "bolo", True)
p("pr-croissant-queijo", "st-padaria-vila-real", "Croissant de Queijo",
  "Croissant folhado recheado com queijo meia-cura.", 7.90,
  img("photo-1587241321921-91a834d6d191"), 18)

# Supermercados Avenida Central
p("pr-arroz-5kg", "st-supermercado-avenida", "Arroz Branco Tipo 1 (5 kg)",
  "Pacote de 5 kg do arroz agulhinha tipo 1.", 27.90,
  img("photo-1601600576337-c1d8a0d1373c"), 80, "pacote", True)
p("pr-cafe-500g", "st-supermercado-avenida", "Café Torrado e Moído (500 g)",
  "Café da Alta Mogiana, torra média.", 18.49,
  img("photo-1584953528653-503bb1c9dbf8"), 45)
p("pr-leite-integral", "st-supermercado-avenida", "Leite Integral (1 L)",
  "Leite integral longa vida.", 5.29,
  img("photo-1670684684445-a4504dca0bbc"), 120)
p("pr-detergente", "st-supermercado-avenida", "Detergente Neutro (500 ml)",
  "Detergente neutro para louças.", 2.79,
  img("photo-1601598851547-4302969d0614"), 90)
p("pr-refrigerante-2l", "st-supermercado-avenida", "Refrigerante Cola (2 L)",
  "Garrafa 2 litros, bem gelada para a entrega.", 9.49,
  img("photo-1601600576337-c1d8a0d1373c"), 70)
p("pr-azeite-500", "st-supermercado-avenida", "Azeite Extravirgem (500 ml)",
  "Azeite extravirgem primeira prensagem.", 34.90,
  img("photo-1584953528653-503bb1c9dbf8"), 30)

# Ateliê & Moda Autoral
p("pr-vestido-artesanal", "st-atelie-moda", "Vestido Algodão Artesanal",
  "Vestido de algodão cru costurado à mão, tamanho M, modelagem ampla.", 189.90,
  img("photo-1767968037382-8eb9c564339f"), 6, "peça", True)
p("pr-cachecol-la", "st-atelie-moda", "Cachecol de Lã Merino",
  "Cachecol trançado no tear manual, lã merino.", 89.90,
  img("photo-1710342368397-67ef89a6a298"), 9)
p("pr-blusa-bordada", "st-atelie-moda", "Blusa Bordada à Mão",
  "Blusa de linho com bordado floral, tamanho G.", 119.90,
  img("photo-1567401893414-76b7b1e5a7a5"), 8)
p("pr-saia-croche", "st-atelie-moda", "Saia de Crochê",
  "Saia longa de crochê em fio de algodão, tamanho P.", 139.90,
  img("photo-1532453288672-3a27e9be9efd"), 5)

# Magazine Estilo Cidade
p("pr-jaqueta-jeans", "st-magazine-estilo", "Jaqueta Jeans Unissex",
  "Jaqueta jeans clássica, lavagem média, tamanhos P ao GG.", 159.90,
  img("photo-1441984904996-e0b6ba687e04"), 20)
p("pr-camiseta-premium", "st-magazine-estilo", "Camiseta Básica Premium",
  "Algodão penteado 30.1, várias cores.", 39.90,
  img("photo-1532453288672-3a27e9be9efd"), 50)
p("pr-calca-alfaiataria", "st-magazine-estilo", "Calça Alfaiataria Feminina",
  "Calça de alfaiataria com cintura alta, tamanhos 36 ao 46.", 129.90,
  img("photo-1567401893414-76b7b1e5a7a5"), 15)
p("pr-vestido-floral", "st-magazine-estilo", "Vestido Midi Floral",
  "Vestido midi com estampa floral, mangas bufantes.", 149.90,
  img("photo-1708317031389-1afe5ccc6f96"), 12, "peça", True)

# Boutique Essência & Beleza
p("pr-perfume-jasmim", "st-boutique-essencia", "Eau de Parfum Flor de Jasmim (100 ml)",
  "Perfume floral com fixação de 8 horas.", 179.90,
  img("photo-1512496015851-a90fb38ba796"), 14, "frasco", True)
p("pr-paleta-sombras", "st-boutique-essencia", "Paleta de Sombras Terracota",
  "12 tons neutros e quentes, acabamento acetinado e cintilante.", 79.90,
  img("photo-1522335789203-aabd1fc54bc9"), 18)
p("pr-hidratante-corporal", "st-boutique-essencia", "Hidratante Corporal Nutritivo",
  "Com manteiga de karité, absorção rápida.", 45.90,
  img("photo-1583209814683-c023dd293cc6"), 25)
p("pr-kit-pinceis", "st-boutique-essencia", "Kit Pincéis Profissionais (12 peças)",
  "Pincéis sintéticos com estojo.", 99.90,
  img("photo-1596462502278-27bfdc403348"), 11, "kit", True)

# Farmácias Saúde Já
p("pr-protetor-solar", "st-farmacia-saude-ja", "Protetor Solar FPS 60",
  "Toque seco, resistente à água, 50 ml.", 59.90,
  img("photo-1583209814683-c023dd293cc6"), 35)
p("pr-vitamina-c", "st-farmacia-saude-ja", "Vitamina C 1 g (60 comprimidos)",
  "Ácido ascórbico, uso diário.", 29.90,
  img("photo-1522335789203-aabd1fc54bc9"), 40)
p("pr-shampoo-fortalecedor", "st-farmacia-saude-ja", "Shampoo Fortalecedor",
  "Com biotina e cafeína, 300 ml.", 24.90,
  img("photo-1596462502278-27bfdc403348"), 28)

# Cosmópolis Tech & Celulares
p("pr-fone-tws", "st-cosmopolis-tech", "Fone Bluetooth TWS",
  "Fones sem fio com estojo de carregamento e 24h de bateria.", 129.90,
  img("photo-1515940175183-6798529cb860"), 22, "un", True)
p("pr-carregador-30w", "st-cosmopolis-tech", "Carregador Rápido 30 W USB-C",
  "Carga rápida turbo com proteção contra sobretensão.", 69.90,
  img("photo-1593344484962-796055d4a3a4"), 30)
p("pr-capa-antimpacto", "st-cosmopolis-tech", "Capa Anti-impacto com Película",
  "Kit de proteção com bordas reforçadas + película de vidro.", 29.90,
  img("photo-1615655406736-b37c4fabf923"), 60)
p("pr-caixa-som", "st-cosmopolis-tech", "Caixa de Som Portátil à Prova d'Água",
  "10 W RMS, resistência IPX7, 12h de reprodução.", 189.90,
  img("photo-1615655406736-b37c4fabf923"), 10, "un", True)
p("pr-headset-gamer", "st-cosmopolis-tech", "Headset Gamer com Microfone",
  "Áudio surround 7.1, almofadas em couro ecosynth.", 219.90,
  img("photo-1498049794561-7780e7231661"), 8)

# Casa & Cia Decorações
p("pr-vaso-ceramico", "st-casa-cia", "Vaso Cerâmico Artesanal Grande",
  "Vaso esmaltado feito em torninho, 28 cm de altura.", 89.90,
  img("photo-1583753075968-1236ccb83c66"), 7, "peça", True)
p("pr-monstera", "st-casa-cia", "Monstera Deliciosa em Vaso",
  "Planta adulta em vaso cerâmico, altura ~60 cm.", 74.90,
  img("photo-1636406261592-055c74637711"), 12)
p("pr-poltrona-vime", "st-casa-cia", "Poltrona de Vime Artesanal",
  "Poltrona de vime natural trançado à mão.", 549.90,
  img("photo-1499916078039-922301b0eb9b"), 3)
p("pr-cachepos", "st-casa-cia", "Jogo de Cachepôs Suspensos",
  "Trio de cachepôs em macramê com vasos incluídos.", 59.90,
  img("photo-1632323187625-7a4e4414338e"), 9, "jogo")

# Vila Artesã
p("pr-cesto-palha", "st-vila-artesa", "Cesto de Palha Trançada",
  "Cesto organiser de palha de milho, 40 cm de diâmetro.", 64.90,
  img("photo-1522065893269-6fd20f6d7438"), 10, "peça", True)
p("pr-ceramica-decorativa", "st-vila-artesa", "Cerâmica Decorativa Feita à Mão",
  "Vaso de cerâmica vermelha com engobo natural.", 119.90,
  img("photo-1673339065030-b3bdb45162f0"), 5)
p("pr-bijuterias", "st-vila-artesa", "Conjunto de Bijuterias Artesanais",
  "Colar + brincos em contas naturais, peça única.", 79.90,
  img("photo-1522065893269-6fd20f6d7438"), 8)
p("pr-tapete-tear", "st-vila-artesa", "Tapete de Tear",
  "Tapete 60×90 cm tecido em tear manual, retalhos de algodão.", 149.90,
  img("photo-1757085242652-f8cd4d3de889"), 4)

# MultiServiços Cosmópolis
p("pr-suporte-tv", "st-multiservicos", "Instalação de Suporte de TV",
  "Técnico verificado instala suporte fixo ou articulado até 65\". Agende por WhatsApp.", 99.90,
  img("photo-1498049794561-7780e7231661"), 10, "serviço", True)
p("pr-reparos-diaria", "st-multiservicos", "Diária de Reparos Residenciais (4 h)",
  "Eletricista ou encanador por 4 horas, material não incluso.", 249.90,
  img("photo-1506806732259-39c2d0268443"), 6, "diária")
p("pr-sobrancelha", "st-multiservicos", "Design de Sobrancelhas com Henna",
  "Profissional de beleza a domicílio, com esterilização comprovada.", 49.90,
  img("photo-1512496015851-a90fb38ba796"), 12, "sessão")

ORDERS = [
    dict(id="ord-demo-pix-1", code="VC-7K2M9A", customer_name="Marina Souza", customer_phone="19991234567",
         neighborhood="Centro", address="Rua dos Cedros, 145 — Centro", pickup=False, payment_method="pix",
         payment_status="aguardando", status="aguardando_pagamento", pix_txid="SIM9F3K2A7QZB",
         items=[dict(product_id="pr-banana-prata", store_id="st-hortifruti-emporio",
                     store_name="Hortifrúti & Empório da Terra", name="Banana Prata fresca", price=6.49,
                     quantity=2, image_url=img("photo-1750601455197-a7ba46fb1544")),
                dict(product_id="pr-pao-frances", store_id="st-padaria-vila-real",
                     store_name="Padaria Vila Real", name="Pão Francês quentinho", price=16.90,
                     quantity=1, image_url=img("photo-1483695028939-5bb13f8648b0"))],
         subtotal=29.88, shipping_total=8.80, total=38.68,
         shipping_breakdown=[dict(store_id="st-hortifruti-emporio", store_name="Hortifrúti & Empório da Terra", fee=4.90),
                             dict(store_id="st-padaria-vila-real", store_name="Padaria Vila Real", fee=3.90)],
         hours_ago=0.4),
    dict(id="ord-demo-card-1", code="VC-4XQ81L", customer_name="Rafael Lima", customer_phone="19991237777",
         neighborhood="Betel", address="Av. das Palmeiras, 780 — Betel", pickup=False, payment_method="card",
         payment_status="pago", status="preparando", pix_txid=None,
         items=[dict(product_id="pr-fone-tws", store_id="st-cosmopolis-tech",
                     store_name="Cosmópolis Tech & Celulares", name="Fone Bluetooth TWS", price=129.90,
                     quantity=1, image_url=img("photo-1515940175183-6798529cb860")),
                dict(product_id="pr-capa-antimpacto", store_id="st-cosmopolis-tech",
                     store_name="Cosmópolis Tech & Celulares", name="Capa Anti-impacto com Película", price=29.90,
                     quantity=1, image_url=img("photo-1615655406736-b37c4fabf923"))],
         subtotal=159.80, shipping_total=9.40, total=169.20,
         shipping_breakdown=[dict(store_id="st-cosmopolis-tech", store_name="Cosmópolis Tech & Celulares", fee=9.40)],
         hours_ago=2.5),
    dict(id="ord-demo-entrega-1", code="VC-2B5H8T", customer_name="Júlia Alves", customer_phone="19991236666",
         neighborhood="Parque Residencial Itapavussu", address="Rua dos Ipês, 90 — Pq. Res. Itapavussu",
         pickup=False, payment_method="delivery", payment_status="na_entrega", status="saiu_para_entrega",
         pix_txid=None,
         items=[dict(product_id="pr-arroz-5kg", store_id="st-supermercado-avenida",
                     store_name="Supermercados Avenida Central", name="Arroz Branco Tipo 1 (5 kg)", price=27.90,
                     quantity=1, image_url=img("photo-1601600576337-c1d8a0d1373c")),
                dict(product_id="pr-leite-integral", store_id="st-supermercado-avenida",
                     store_name="Supermercados Avenida Central", name="Leite Integral (1 L)", price=5.29,
                     quantity=2, image_url=img("photo-1670684684445-a4504dca0bbc"))],
         subtotal=38.48, shipping_total=8.90, total=47.38,
         shipping_breakdown=[dict(store_id="st-supermercado-avenida", store_name="Supermercados Avenida Central", fee=8.90)],
         hours_ago=5.0),
    dict(id="ord-demo-entregue-1", code="VC-9P3D6R", customer_name="Pedro Henrique", customer_phone="19991235555",
         neighborhood="Observatório", address="Rua Berta Lopes, 12 — Observatório", pickup=False,
         payment_method="card", payment_status="pago", status="entregue", pix_txid=None,
         items=[dict(product_id="pr-vestido-artesanal", store_id="st-atelie-moda",
                     store_name="Ateliê & Moda Autoral Cosmopolense", name="Vestido Algodão Artesanal", price=189.90,
                     quantity=1, image_url=img("photo-1767968037382-8eb9c564339f"))],
         subtotal=189.90, shipping_total=8.90, total=198.80,
         shipping_breakdown=[dict(store_id="st-atelie-moda", store_name="Ateliê & Moda Autoral Cosmopolense", fee=8.90)],
         hours_ago=30.0),
]


async def main() -> None:
    from lib.cosmopolis import PLACEHOLDER_IMAGES

    now = utc_now()

    for s in STORES:
        doc = dict(s)
        doc.setdefault("verified", True)
        doc.setdefault("is_open", True)
        doc["created_at"] = now
        await db.stores.replace_one({"id": doc["id"]}, doc, upsert=True)

    for item in P:
        doc = dict(item)
        store = next(s for s in STORES if s["id"] == doc["store_id"])
        doc["category_id"] = store["category_id"]
        doc["available"] = True
        if not doc["image_url"]:
            doc["image_url"] = PLACEHOLDER_IMAGES[doc["category_id"]]
        doc["created_at"] = now
        await db.products.replace_one({"id": doc["id"]}, doc, upsert=True)

    for o in ORDERS:
        doc = {k: v for k, v in o.items() if k != "hours_ago"}
        doc["created_at"] = now - timedelta(hours=o["hours_ago"])
        await db.orders.replace_one({"id": doc["id"]}, doc, upsert=True)

    await ensure_indexes()
    print(f"Seed OK: {len(STORES)} lojas, {len(P)} produtos, {len(ORDERS)} pedidos de demonstração.")


if __name__ == "__main__":
    asyncio.run(main())
    client.close()
