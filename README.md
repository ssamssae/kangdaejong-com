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

`https://kangdaejong.com/protein/`이 도감의 정본입니다. 회사 Astro 빌드에 실제 도감을 포함합니다.
`npm run test:protein`은 회사 경로에서 검색·필터·3D 보기를 검사합니다.
기존 단백질 루트는 새 경로로 301 이동합니다. 기존 자산 주소는 유지합니다.
`npm run build:protein`과 Pages `protein-kangdaejong`은 기존 자산 호환을 위해 함께 유지합니다.

## 공개 주소 통합 — T-261017-028

제품 안내와 4종 브릿지 설명서는 `/product/`, 앱 지원은 `/apps/dutchpay/`·`/apps/memoyo/`·`/apps/yakmukja/`입니다.
첫이름·한장상호·천원 토정비결의 회사 안내는 `/cheotireum/`·`/sangho/`·`/tojeong/`입니다.
결제·입력·주문 조회와 기존 Flutter 앱은 데이터·등록 주소를 보존하도록 기존 origin에서 실행합니다.
이 주소는 회사 정적 페이지·작업장·대표 소개와 같은 `/sitemap.xml`에 포함됩니다.
제품 프록시는 `workshop-router/product-guides.mjs`, 이전 제품 호스트의 301은 claude-automations의 `workers/product-docs/`가 담당합니다.
검증: `npm run test:site-release`, `npx playwright test --config playwright.public-paths.config.mjs`, `npm run test:protein`.

## 기능 확인

[기능 확인 경로](docs/feature-map.md)에서 홈페이지와 복붙 정리기의 동작 검증 방법을 확인합니다.

## 사이트 변경 검증·배포

공통 변경은 [사이트 누락 방지 절차](docs/site-release.md)를 따른다. 승인된 회사홈 배포 명령은 `npm run deploy:site`다. 대상 발견·회귀 검사·공개 바이트/화면 검증을 함께 실행한다.
