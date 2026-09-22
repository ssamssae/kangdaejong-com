// Run in the CUA browser REPL with a tab already showing ProductExamples.
// Uses the documented tab.playwright surface; no browser launch or external state.
export async function verifyProductScreenZoom(tab) {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  for (const name of ['한줄일기', '메모요', '첫이름']) {
    const trigger = tab.playwright.getByRole('link', {name: `${name} 화면 확대 보기`, exact: true});
    await trigger.click();
    const state = await tab.playwright.evaluate(() => {
      const d = document.querySelector('.screen-dialog'); const i = d.querySelector('img');
      return {open: d.open, alt: i.alt, src: i.getAttribute('src'), locked: document.documentElement.style.overflow === 'hidden'};
    });
    assert(state.open && state.locked && state.alt === `${name} 실제 앱 화면` && state.src.includes('-full-'), `${name}: enlarged image should open`);
    await tab.playwright.getByRole('button', {name: '확대 화면 닫기', exact: true}).click();
    const closed = await tab.playwright.evaluate(() => ({open: document.querySelector('.screen-dialog').open, locked: document.documentElement.style.overflow === 'hidden', focus: document.activeElement?.getAttribute('aria-label')}));
    assert(!closed.open && !closed.locked && closed.focus === `${name} 화면 확대 보기`, `${name}: close restores focus and scrolling`);
  }
  await tab.playwright.getByRole('link', {name: '한줄일기 화면 확대 보기', exact: true}).press('Enter');
  assert(await tab.playwright.getByRole('dialog').isVisible(), 'Enter opens image');
  await tab.playwright.getByRole('button', {name: '확대 화면 닫기', exact: true}).press('Escape');
  assert(!(await tab.playwright.getByRole('dialog').isVisible()), 'Escape closes image');
  return 'PASS: 3 image opens, close/focus/scroll restoration, keyboard Enter and Escape';
}

// A pending new source must never display the previously loaded product image.
export async function verifyNoStaleScreen(tab) {
  for (const name of ['한줄일기', '메모요', '첫이름']) {
    await tab.playwright.getByRole('link', {name: `${name} 화면 확대 보기`, exact: true}).click();
    const safe = await tab.playwright.evaluate(() => {
      const image = document.querySelector('[data-screen-full]');
      return image.hidden || (image.complete && image.currentSrc === image.src);
    });
    if (!safe) throw new Error('Previous product image remained visible during loading');
    await tab.playwright.getByRole('button', {name: '확대 화면 닫기', exact: true}).click();
  }
  return 'PASS: no previous product image during source changes';
}
