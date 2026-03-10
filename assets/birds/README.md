# Avatares de pássaros (PNG)

Coloque aqui as imagens PNG dos pássaros usados como avatar no app.

**Arquivos esperados:**

- `arara.png`
- `pica-pau.png`
- `tucano.png`
- `beija-flor.png`
- `pomba.png`
- `canario.png`

**Para carregamento rápido:** os avatares são exibidos em tamanho pequeno (32–56 px). Imagens muito grandes atrasam o carregamento. Para reduzir o tamanho dos arquivos:

1. **Pelo script (recomendado):** na raiz do projeto, rode `npm run resize-birds`. É necessário ter `sharp` instalado (`npm install`). O script redimensiona cada PNG para no máximo 256 px e comprime, sobrescrevendo os arquivos — faça backup dos originais se quiser mantê-los.
2. **Manual:** redimensione cada imagem para algo como 256×256 px e salve como PNG (ou JPEG, ajustando os `require()` em `src/components/birds/index.ts` para `.jpg`).
