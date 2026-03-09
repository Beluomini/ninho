# Ninho — Contexto do Projeto para IA

Este documento descreve o aplicativo **Ninho**, sua arquitetura, convenções e detalhes técnicos para que modelos de IA possam contribuir de forma consistente com o código existente.

---

## 1. Visão geral do produto

**Ninho** é um app de **gestão residencial compartilhada**: várias pessoas pertencem a uma mesma **Casa** (Ninho) e compartilham tarefas, finanças e lista de compras. O objetivo é que as ações de um morador reflitam para todos (futuramente em tempo real; hoje os dados são em memória/mock).

**Funcionalidades principais:**
- **Mural (Bulletin Board):** exibe apenas a **última mensagem** enviada por alguém da casa (texto, ou futuramente áudio/imagem/vídeo). Campo inferior para enviar novo recado.
- **Lista de Compras:** itens com checkbox (marcar comprado), input + botão "+" para adicionar. O "+" sem texto ou em long press abre sugestões rápidas (Leite, Pão, Ovos, etc.).
- **Tarefas (Chores):** cards de tarefas com responsável, data, recorrência; filtro por membro; botão para nova tarefa.
- **Finanças:** saldo em destaque, abas Overview / Estatísticas / Arquivo, lista de transações, botão "Criar Nova Despesa" e modal para entrada/saída.
- **Configurações:** perfil (nome editável, foto), tema claro/escuro, idioma (PT/EN), seções Casa e Aplicativo, lista de moradores, "Sair da Casa".

**Design:** visual limpo, cards arredondados, tipografia sans-serif. Paleta em tons de verde pastel, cinza claro e branco no modo claro; tema escuro com fundos escuros e verdes suavizados.

---

## 2. Stack e versões

| Tecnologia | Versão / Observação |
|------------|---------------------|
| **Framework** | React Native com Expo (Managed Workflow) |
| **Expo SDK** | 54.0.2 (intencionalmente 54 por disponibilidade na App Store) |
| **React** | 19.1.0 |
| **React Native** | 0.81.5 |
| **Linguagem** | TypeScript (strict) |
| **Roteamento** | Expo Router ~6.0.23 (file-based, entrada `expo-router/entry`) |
| **Estilização** | NativeWind 4.x + Tailwind CSS 3.4.x. Uso de **estilos inline (StyleSheet/object)** nas telas para tema dinâmico; `className` Tailwind em poucos componentes (ex.: Avatar). |
| **Ícones** | lucide-react-native |
| **Persistência local** | @react-native-async-storage/async-storage (configurações do app) |
| **Outros** | react-native-safe-area-context, react-native-screens, react-native-reanimated, react-native-worklets, react-native-svg |

**Importante:** O projeto foi ajustado para SDK 54; ao adicionar dependências, preferir `npx expo install <pkg>` e, se necessário, `--legacy-peer-deps` para conflitos de peer.

---

## 3. Estrutura de pastas

```
ninho/
├── app/                        # Rotas (Expo Router)
│   ├── _layout.tsx             # Root: SafeAreaProvider → SettingsProvider → AppContent (Stack)
│   └── (tabs)/
│       ├── _layout.tsx         # Tab bar (5 abas), títulos e ícones via t.tabs.* e useTheme()
│       ├── index.tsx           # Mural
│       ├── shopping.tsx        # Lista de compras
│       ├── chores.tsx          # Tarefas
│       ├── finances.tsx        # Finanças
│       └── settings.tsx        # Configurações
├── src/
│   ├── types/
│   │   └── index.ts            # Interfaces e tipos globais
│   ├── constants/
│   │   └── colors.ts           # Theme (Light/Dark), getTheme()
│   ├── data/
│   │   └── mock.ts             # Dados iniciais (users, house, latestMessage, shoppingItems, transactions, chores)
│   ├── i18n/
│   │   ├── index.ts            # getTranslations(locale), interpolate(), tipos Locale e Translations
│   │   ├── pt.ts               # Strings em português
│   │   └── en.ts               # Strings em inglês
│   ├── contexts/
│   │   └── SettingsContext.tsx # Provider: locale, isDarkMode, userName, userPhoto; persistência AsyncStorage
│   ├── hooks/
│   │   ├── useHouseData.ts     # Dados da casa (mock em estado local; preparado para migração Supabase)
│   │   └── useTheme.ts         # useSettings().isDarkMode → Theme
│   └── components/
│       └── ui/                 # Card, Avatar, Badge, TabSelector, ChatInput, AddItemInput
├── assets/                     # Ícones, splash, favicon
├── global.css                  # @tailwind base/components/utilities (importado em app/_layout.tsx)
├── tailwind.config.js          # content app + src; preset nativewind; cores customizadas
├── babel.config.js             # babel-preset-expo (jsxImportSource: nativewind) + nativewind/babel
├── metro.config.js             # withNativeWind(config, { input: './global.css' })
├── nativewind-env.d.ts         # /// <reference types="nativewind/types" />
├── app.json                    # Expo (name, slug, scheme, plugins: expo-router)
├── tsconfig.json               # baseUrl ".", paths "@/*" -> "./src/*"
└── package.json                # main: "expo-router/entry"
```

---

## 4. Tipos principais (`src/types/index.ts`)

- **User:** `id`, `name`, `avatarUrl`, `email`
- **House:** `id`, `name`, `members: User[]`, `createdAt`
- **MessageMediaType:** `"text" | "image" | "audio" | "video"`
- **Message:** `id`, `authorId`, `content`, `mediaType`, `mediaUrl?`, `createdAt`
- **Activity:** `id`, `userId`, `description`, `type`, `createdAt` (usado em tipos; mock de activities foi removido)
- **ShoppingCategory:** `"dairy" | "meat" | "produce" | "bakery" | "beverages" | "cleaning" | "other"`
- **ShoppingItem:** `id`, `name`, `category`, `quantity`, `unit`, `isCompleted`, `addedBy`, `completedBy?`
- **Transaction:** `id`, `description`, `amount` (positivo = entrada), `category`, `date`, `paidBy`, `type: "income" | "expense" | "investment"`
- **Chore:** `id`, `title`, `assignedTo`, `dueDate`, `isCompleted`, `recurrence: "daily" | "weekly" | "monthly" | "once"`

---

## 5. Temas e cores (`src/constants/colors.ts`)

- **Theme:** interface com `primary`, `secondary`, `background`, `surface`, `border`, `text`, `textLight`, `danger`, `success`, `inactive`, `card`, `inputBg`.
- **LightTheme** e **DarkTheme** implementam essa interface.
- **getTheme(isDark: boolean): Theme** retorna o tema ativo.
- As telas usam **useTheme()** (que lê `useSettings().isDarkMode`) e passam `theme` para componentes que precisam (Card, Badge, TabSelector, ChatInput, AddItemInput, etc.).

---

## 6. Internacionalização (i18n)

- **Idiomas:** `pt` e `en` (offline; strings em `src/i18n/pt.ts` e `src/i18n/en.ts`).
- **Locale** e **Translations** (tipo = `typeof pt`).
- **getTranslations(locale): Translations**
- **interpolate(text, vars):** substitui `{{key}}` por `vars[key]` (ex.: `{{count}}`).
- Uso nas telas: `const { t, i } = useSettings();` — `t` é o objeto de traduções do locale atual; para plural/contagem usar `i(t.chores.pendingCount, { count: n })`.
- Novas strings: adicionar em **pt.ts** e **en.ts** na mesma chave (ex.: `settings.newKey`) para manter tipagem e consistência.

---

## 7. Configurações e persistência (`src/contexts/SettingsContext.tsx`)

- **Chaves AsyncStorage:** `@ninho/locale`, `@ninho/darkMode`, `@ninho/userName`, `@ninho/userPhoto`.
- **Estado:** `locale`, `isDarkMode`, `userName`, `userPhoto`, `isLoaded`.
- **API do contexto:** `t` (Translations), `i` (interpolate), `setLocale`, `setDarkMode`, `setUserName`, `setUserPhoto`.
- O **usuário “atual”** nas telas é o primeiro do mock (`currentUser` = users[0]); nome e foto exibidos vêm de **userName** e **userPhoto** do Settings quando o `id` é `"u1"`, para refletir o perfil editável.

---

## 8. Dados da casa (`src/hooks/useHouseData.ts`)

- Estado em memória inicializado por `src/data/mock.ts`: `house`, `currentUser`, `latestMessage`, `shoppingItems`, `transactions`, `chores`.
- **balance:** soma de `transactions[].amount`.
- **Funções:** `getUserById`, `postMessage`, `addShoppingItem`, `toggleShoppingItem`, `removeShoppingItem`, `addTransaction`, `toggleChore`, `addChore`.
- O hook não persiste dados; a ideia é substituir depois por chamadas a Supabase (PostgreSQL + Auth), mantendo a mesma interface.

---

## 9. Componentes de UI (`src/components/ui/`)

- **Card:** `children`, `theme?: Theme`, `style?`. Fundo `theme.card`, bordas arredondadas, sombra leve.
- **Avatar:** `uri?`, `name`, `size?: "sm" | "md" | "lg"`. Se não houver `uri`, mostra iniciais. Usa Tailwind (className) para layout.
- **Badge:** `label`, `variant?: "default" | "success" | "danger" | "outline"`, `theme?`.
- **TabSelector:** `tabs: string[]`, `activeTab`, `onTabChange`, `theme?`. Abas horizontais estilizadas.
- **ChatInput:** `placeholder?`, `onSend(text: string)`, `theme?`. Input + botão enviar.
- **AddItemInput:** `placeholder?`, `onAdd(text: string)`, `onPlusLongPress?`, `theme?`. Input + botão "+"; long press no "+" usado para abrir sugestões na lista de compras.

Em telas com tema dinâmico, **sempre passar `theme`** (ex.: `theme={theme}`) para esses componentes quando existir a prop.

---

## 10. Padrões das telas

- **Layout:** `SafeAreaView` com `style={{ flex: 1, backgroundColor: theme.background }}`.
- **Hooks típicos:** `useHouseData()`, `useSettings()` (para `t`, `i`, `userName`, `userPhoto`, etc.), `useTheme()`.
- **Cores e textos:** usar `theme.*` para cores e `t.*` para textos; plural/contagem com `i(t.xxx, { count: n })`.
- **Listas:** `FlatList` com `contentContainerStyle` e `ItemSeparatorComponent` quando fizer sentido.
- **Modais:** `Modal` do React Native com overlay e conteúdo usando `theme.surface`, `theme.inputBg`, etc.
- **Botões de ação:** geralmente `Pressable` com cores `theme.primary` ou `theme.danger` conforme o caso.

---

## 11. Navegação (Expo Router)

- **Entrada:** `main: "expo-router/entry"` no `package.json`.
- **Root:** `app/_layout.tsx` → `SafeAreaProvider` → `SettingsProvider` → `AppContent` (splash de carregamento enquanto `!isLoaded`, depois `Stack` com `(tabs)`).
- **Tabs:** `app/(tabs)/_layout.tsx` define as 5 abas; títulos vêm de `t.tabs.*`, cores da tab bar de `useTheme()`.
- Rotas por arquivo: `index` = Mural, `shopping`, `chores`, `finances`, `settings`. Não há rotas aninhadas além do grupo `(tabs)`.

---

## 12. Convenções de código

- **TypeScript:** modo strict; preferir tipos explícitos em props e retornos de funções exportadas.
- **Estilo:** nas telas, preferir objeto de estilo inline (`style={{ ... }}`) ou `StyleSheet` para que o tema seja aplicado dinamicamente; evitar strings de classe Tailwind em trechos que dependem de `theme`.
- **Ids de usuário:** no mock, o usuário “logado” é o primeiro (`u1`). Ao exibir nome/foto, se `user.id === "u1"` usar `userName` e `userPhoto` do Settings.
- **IDs gerados:** padrão `m${Date.now()}`, `s${Date.now()}`, etc., para mensagens e itens criados no cliente.
- **Moeda:** valores em número (positivo = entrada); formatação BRL feita nas telas (ex.: `R$ X.XXX,XX`).

---

## 13. Próximos passos planejados (contexto para evolução)

- Migrar dados para **Supabase** (PostgreSQL + Auth), mantendo a API atual do `useHouseData` (ou um hook equivalente).
- Sincronização em tempo real (ex.: Supabase Realtime) para refletir ações de todos os moradores.
- Suporte completo a mídia no Mural (upload de imagem/áudio/vídeo e exibição).
- Possível suporte a seleção/upload de foto de perfil nas configurações (já existe `setUserPhoto` e persistência).

---

## 14. Comandos úteis

```bash
npm start          # expo start
npx expo start --clear   # limpar cache do Metro
npx expo install <pkg>   # instalar dependência compatível com SDK 54
npx tsc --noEmit   # checagem de tipos
```

---

Este arquivo deve ser mantido atualizado quando forem adicionadas novas telas, tipos, contextos ou convenções relevantes para a consistência do projeto e para o trabalho de modelos de IA.
