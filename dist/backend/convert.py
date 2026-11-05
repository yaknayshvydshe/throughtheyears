#!/usr/bin/env python3
"""
Converte as fotos originais (HEIC, JPEG, PNG) para JPEG otimizado na pasta fotos/,
com os nomes exatos que o data.js espera.

Uso (a partir da pasta do projeto, com as originais em originais/):
    python3 convert.py

Requisitos (gratuitos):
  - macOS: nada a instalar (usa o 'sips', que lê HEIC nativamente), ou
  - Outros sistemas: ImageMagick com suporte a HEIC (comando 'magick').
    Ex.: sudo apt install imagemagick libheif-examples
"""
import json, os, re, shutil, subprocess, sys

MAX_SIDE = 1600      # maior lado em pixels (boa qualidade no modal, leve no celular)
QUALITY = 82
ORIGENS = "originais"
DATA = "data.js"


def carregar_fotos(caminho):
    """Lê o array PHOTOS de data.js (uma entrada por linha)."""
    fotos = []
    with open(caminho, encoding="utf-8") as f:
        for linha in f:
            linha = linha.strip()
            if linha.startswith("{"):
                fotos.append(json.loads(linha.rstrip(",")))
    return fotos


def ferramenta():
    if shutil.which("sips") and sys.platform == "darwin":
        return "sips"
    if shutil.which("magick"):
        return "magick"
    sys.exit("Instale o ImageMagick (com suporte a HEIC) ou rode em um Mac.")


def converter(origem, destino, usar):
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    if usar == "sips":
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(QUALITY),
                        "-Z", str(MAX_SIDE), origem, "--out", destino],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        subprocess.run(["magick", origem, "-auto-orient", "-resize", f"{MAX_SIDE}x{MAX_SIDE}>",
                        "-strip", "-quality", str(QUALITY), destino], check=True)


def main():
    fotos = carregar_fotos(DATA)
    if not fotos:
        sys.exit("Nenhuma foto encontrada em data.js.")
    usar = ferramenta()
    ok, faltando, erros = 0, [], []
    for foto in fotos:
        origem = os.path.join(ORIGENS, foto["original"])
        if not os.path.exists(origem):
            faltando.append(foto["original"])
            continue
        try:
            converter(origem, foto["src"], usar)
            ok += 1
        except subprocess.CalledProcessError as e:
            erros.append((foto["original"], str(e)))
    print(f"Convertidas: {ok} de {len(fotos)}")
    if faltando:
        print(f"Originais não encontrados em {ORIGENS}/ ({len(faltando)}):")
        for nome in faltando:
            print("  -", nome)
    if erros:
        print("Falhas:")
        for nome, msg in erros:
            print("  -", nome, msg)


if __name__ == "__main__":
    main()