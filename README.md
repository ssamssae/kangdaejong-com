# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## 단백질 도감

`https://protein.kangdaejong.com/`은 같은 저장소의 별도 Astro 빌드입니다.
`npm run build:protein`은 `dist-protein/`을 만들고, `npm run test:protein`으로 도감을 검증합니다.
Cloudflare Pages 프로젝트는 `protein-kangdaejong`입니다. 회사 홈페이지는 기존 `npm run build` / `kangdaejong-com`을 사용합니다.
공통 헤더를 수정하면 두 빌드를 검증하고 각각 배포합니다. 기존 회사 홈페이지 `/protein/`은 전용 주소로 이동합니다.

## 기능 확인

[메뉴 추첨기 확인 경로](docs/feature-map.md)에서 홈페이지 동작 검증 방법을 확인합니다.
