# Plantify
Mapeamento da Flora do Campus do Vale: protótipo funcional (INF01043 – IHC, UFRGS).

Aplicativo web *mobile-first* de ciência cidadã: mapa com GPS, cadastro rápido/detalhado de árvores,
ficha botânica, instants (fotos rápidas), comentários e verificação por especialistas.
**Não há servidor**: tudo fica salvo no próprio navegador (IndexedDB), e o "envio" é simulado.

## 📱 Usar no celular (sem PC): **https://extreme500.github.io/Plantify/**

O app está publicado no GitHub Pages como **PWA** (aplicativo web instalável). Não precisa de computador:

1. Abra **https://extreme500.github.io/Plantify/** no celular (Chrome no Android, Safari no iPhone).
2. **Instale na tela inicial** para usar como aplicativo, em tela cheia:
   - **Android (Chrome):** menu **⋮** → *Instalar app* (ou *Adicionar à tela inicial*).
   - **iPhone (Safari):** botão **Compartilhar** → *Adicionar à Tela de Início*.
3. Abra pelo ícone **Plantify** e permita **localização** e **câmera** quando pedir.

Depois do primeiro acesso, o app **abre mesmo sem internet**. As partes do mapa que você já viu
também ficam guardadas. Cada aparelho tem seus próprios dados (não há servidor).

O site é atualizado automaticamente a cada push na `main` (workflow `.github/workflows/deploy.yml`).
Se uma versão nova não aparecer, feche o app e abra de novo.

## Rodar no computador (desenvolvimento)

Requer Node 18+.

```bash
npm install
npm run dev            # abre em http://localhost:5173 (no PC aparece numa moldura de celular)
```

### Testar no celular a versão do seu computador (opcional)

Útil para testar mudanças antes de dar push. O computador serve o app e o celular acessa pela
rede Wi-Fi. Câmera e GPS do navegador só funcionam em **HTTPS**, por isso existe um comando
específico para o celular.

1. **Conecte o computador e o celular na mesma rede Wi-Fi.**
   Redes como a *eduroam* costumam bloquear a comunicação entre aparelhos. Se não funcionar, use o
   roteador de casa ou crie um **ponto de acesso (hotspot) no próprio celular** e conecte o computador nele.
2. **No computador, dentro da pasta do projeto, rode:**
   ```bash
   npm install          # só na primeira vez
   npm run dev:celular
   ```
3. **Anote o endereço "Network"** que aparece no terminal, por exemplo:
   ```
   ➜  Local:   https://localhost:5173/
   ➜  Network: https://192.168.0.9:5173/     ← este
   ```
   Se aparecerem vários, use o que começa com `192.168.` (ou `10.` / `172.`, conforme a rede).
   Endereços de adaptadores virtuais (VirtualBox, Radmin, VPN…) não funcionam.
   Se a porta 5173 estiver ocupada, o Vite usa a próxima (5174…): use sempre a porta mostrada no terminal.
4. **Windows: libere o firewall.** Na primeira vez, o Windows pergunta se o *Node.js* pode acessar a rede:
   marque **Redes privadas** e clique em *Permitir acesso*. Se a janela não aparecer e o celular não
   conectar, verifique se a rede Wi-Fi está configurada como *Privada* no Windows.
5. **No celular, abra o navegador** (Chrome no Android, Safari no iPhone) e digite o endereço completo,
   **com `https://` e a porta `:5173`**.
6. **Aceite o aviso de segurança.** O certificado é autoassinado, então o navegador mostra
   "Sua conexão não é particular":
   - **Chrome/Android:** toque em *Avançado* → *Continuar para 192.168.x.x (não seguro)*.
   - **Safari/iPhone:** toque em *Mostrar detalhes* → *visitar este site* → confirme.
7. **Permita localização e câmera** quando o app pedir. Se negar sem querer, libere no ícone de cadeado
   ao lado do endereço (Chrome) ou em *Ajustes → Safari* (iPhone).
8. *(Opcional)* **Instale como app:** no Chrome, menu ⋮ → *Adicionar à tela inicial*; no Safari,
   *Compartilhar* → *Adicionar à Tela de Início*. Ele abre em tela cheia, como um aplicativo.

Observações:
- O computador precisa continuar ligado com o terminal aberto enquanto o celular usa o app.
  Para encerrar, aperte `Ctrl + C` no terminal.
- Os dados ficam salvos **no navegador de cada aparelho**: o que é cadastrado no celular não aparece no
  computador, e vice-versa.
- Fora do Campus do Vale, o app usa uma posição simulada (ponto roxo arrastável no mapa). No campus,
  ele usa o GPS real.

## O que está simulado

| Recurso | Como funciona no protótipo |
|---|---|
| Servidor / envio | Atraso de ~1 s e tela "Envio confirmado". Os dados ficam no IndexedDB do navegador. |
| Sem conexão | Detecta offline real **ou** liga *Configurações → Simular sem conexão*. O registro é salvo no aparelho, aparece "Erro no envio / Tentar novamente" e tudo é sincronizado quando a conexão volta. |
| GPS | Usa o GPS real se você estiver no Campus do Vale. Fora dele (ou com GPS negado), usa uma **posição simulada**: o ponto roxo no mapa, que pode ser arrastado. |
| Notificações | Internas ao app (menu ☰ → Notificações). Como os dados são locais, para ver a notificação do especialista é preciso sair e entrar com uma conta especialista no mesmo aparelho. |
| Idioma | Só Português. As outras opções aparecem como "em breve". |
| Mapa | Tiles do OpenStreetMap (precisam de internet). O restante do app funciona offline. |

Para recomeçar do zero: *Configurações → Restaurar dados de demonstração*.

## Roteiro sugerido de demonstração (cenários da Sprint 1)

1. **Primeiro acesso**: registre-se como *Explorador(a)*. O tutorial aparece (e pode ser revisto em Configurações).
2. **Valentina (consulta)**: toque no marcador da araucária *Amigo do Couto* (perto da Informática) → *Ver ficha*
   → aba **Comentários** (thread dos esboços) → aba **Instants** → *Tirar um instant*, marcar "Floração" e publicar.
   Exclua o instant pela lixeira.
3. **Lucas (árvore inexistente)**: arraste o ponto roxo até um lugar sem árvore → *Adicionar árvore* → **Rápido**
   → tire a foto → *Salvar registro*. Ela entra no mapa como **Identificação pendente**.
4. **Sem sinal**: ligue *Simular sem conexão*, faça um **Cadastro detalhado** (busque "ipê" para autocompletar
   espécie e família, toque em *Sugerir fontes abertas*) → aparece "Erro no envio". Desligue a simulação: o item sincroniza.
5. **Dra. Olívia (validação)**: saia, crie uma conta **Especialista** → veja a notificação de ponto pendente
   → abra a árvore → *Completar informações* → informe o nome científico → *Atribuir selo "Espécie verificada"*.
   Especialistas também podem marcar **Exótica invasora**.
6. Use os **filtros** do mapa (Verificadas, Identificadas, Pendentes, Invasoras) e o **Modo escuro**.

## Estrutura

```
src/
  data/        tipos, dados de demonstração (seed), catálogo de espécies, contorno do campus (OSM)
  store/       estado global (zustand) + persistência no IndexedDB + fila offline
  lib/         ilustrações SVG das fotos de exemplo, utilitários (distância, datas, compressão de imagem)
  components/  câmera, peças do mapa (Leaflet), tutorial, menu, componentes de UI
  screens/     telas (boas-vindas, registro, mapa, ficha, instants, comentários, cadastros, resultado, configurações…)
```

Stack: React 18 + TypeScript + Vite, Leaflet/react-leaflet, zustand, idb-keyval, lucide-react.
