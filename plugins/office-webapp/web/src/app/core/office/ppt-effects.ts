import { attr, descendants, findChild, findChildren, parseXml, type XmlNode } from '../binary/xml';

export type PptTransitionType =
  | 'none' | 'fade' | 'push' | 'wipe' | 'split' | 'reveal' | 'cut' | 'zoom' | 'cover' | 'pull' | 'morph';

export interface PptTransition {
  type: PptTransitionType;
  durationMs: number;
  advanceAfterMs?: number;
}

export type PptAnimationEffect = 'appear' | 'fade' | 'fly-in' | 'zoom' | 'wipe';
export type PptAnimationTrigger = 'click' | 'after';

export interface PptAnimation {
  targetId: string;
  effect: PptAnimationEffect;
  durationMs: number;
  delayMs: number;
  trigger: PptAnimationTrigger;
  direction?: string;
}

const TRANSITION_TAGS: Record<string, PptTransitionType> = {
  'p:fade': 'fade',
  'p:push': 'push',
  'p:wipe': 'wipe',
  'p:split': 'split',
  'p:reveal': 'reveal',
  'p:cut': 'cut',
  'p:zoom': 'zoom',
  'p:cover': 'cover',
  'p:pull': 'pull',
  'p14:morph': 'morph',
  'p159:morph': 'morph',
};

const FILTER_EFFECT: Record<string, PptAnimationEffect> = {
  fade: 'fade',
  'slide(fromBottom)': 'fly-in',
  'slide(fromLeft)': 'fly-in',
  'slide(fromRight)': 'fly-in',
  'slide(fromTop)': 'fly-in',
  'zoom(in)': 'zoom',
  'wipe(up)': 'wipe',
  'wipe(down)': 'wipe',
  'wipe(left)': 'wipe',
  'wipe(right)': 'wipe',
};

const EFFECT_FILTER: Record<PptAnimationEffect, { filter: string; preset: number }> = {
  appear: { filter: '', preset: 1 },
  fade: { filter: 'fade', preset: 10 },
  'fly-in': { filter: 'slide(fromBottom)', preset: 2 },
  zoom: { filter: 'zoom(in)', preset: 23 },
  wipe: { filter: 'wipe(up)', preset: 22 },
};

const EFFECT_CSS: Record<PptAnimationEffect, string> = {
  appear: 'op-anim-appear',
  fade: 'op-anim-fade',
  'fly-in': 'op-anim-fly',
  zoom: 'op-anim-zoom',
  wipe: 'op-anim-wipe',
};

export function parseTransition(root: XmlNode | undefined): PptTransition | undefined {
  if (!root) return undefined;
  const node = findChild(root, 'p:transition');
  if (!node) return undefined;
  const durationMs = readDuration(node);
  const advanceAfterMs = attr(node, 'advTm') ? Number(attr(node, 'advTm')) : undefined;
  for (const child of node.children) {
    const type = TRANSITION_TAGS[child.name];
    if (type) return { type, durationMs, advanceAfterMs };
  }
  return { type: 'none', durationMs, advanceAfterMs };
}

export function applyTransition(root: XmlNode, transition: PptTransition): void {
  root.children = root.children.filter((child) => child.name !== 'p:transition');
  if (transition.type === 'none') return;
  const spd = transition.durationMs >= 700 ? 'slow' : transition.durationMs <= 300 ? 'fast' : 'med';
  const attrs: Record<string, string> = {
    spd,
    'xmlns:p14': 'http://schemas.microsoft.com/office/powerpoint/2010/main',
    'p14:dur': String(transition.durationMs),
  };
  if (transition.advanceAfterMs !== undefined) attrs['advTm'] = String(transition.advanceAfterMs);
  const child: XmlNode = { name: '', attrs: {}, text: '', children: [] };
  if (transition.type === 'morph') {
    child.name = 'p14:morph';
    child.attrs = { option: 'byObject' };
  } else {
    child.name = `p:${transition.type}`;
    if (transition.type === 'push' || transition.type === 'wipe' || transition.type === 'reveal') {
      child.attrs = { dir: 'u' };
    }
  }
  const node: XmlNode = { name: 'p:transition', attrs, text: '', children: [child] };
  const anchor = root.children.findIndex((item) => item.name === 'p:clrMapOvr' || item.name === 'p:timing');
  if (anchor < 0) root.children.push(node);
  else root.children.splice(anchor, 0, node);
}

export function parseAnimations(root: XmlNode | undefined): PptAnimation[] {
  if (!root) return [];
  const timing = findChild(root, 'p:timing');
  if (!timing) return [];
  const animations: PptAnimation[] = [];
  walkTiming(timing, { durationMs: 500, delayMs: 0, trigger: 'click', preset: 0 }, animations);
  return animations;
}

interface TimingContext {
  durationMs: number;
  delayMs: number;
  trigger: PptAnimationTrigger;
  preset: number;
}

function walkTiming(node: XmlNode, context: TimingContext, out: PptAnimation[]): void {
  let current = context;
  if (node.name === 'p:cTn') {
    const duration = Number(attr(node, 'dur'));
    const preset = Number(attr(node, 'presetID') ?? 0);
    const nodeType = attr(node, 'nodeType') ?? '';
    const trigger: PptAnimationTrigger = nodeType === 'afterEffect' || nodeType === 'withEffect' ? 'after' : 'click';
    const delay = delayOf(node);
    current = {
      durationMs: Number.isFinite(duration) && duration > 0 ? duration : context.durationMs,
      delayMs: delay === undefined ? context.delayMs : Math.max(context.delayMs, delay),
      trigger: nodeType ? trigger : context.trigger,
      preset: Number.isFinite(preset) ? preset : context.preset,
    };
  }
  if (node.name === 'p:animEffect') {
    const filter = attr(node, 'filter') ?? '';
    const transition = attr(node, 'transition');
    if (transition === 'in' || transition === undefined) {
      const target = descendants(node, 'p:spTgt')[0];
      const targetId = attr(target, 'spid');
      const effectDuration = Number(attr(descendants(node, 'p:cTn')[0], 'dur'));
      if (targetId) {
        const effect = FILTER_EFFECT[filter] ?? presetEffect(current.preset) ?? 'fade';
        out.push({
          targetId,
          effect,
          durationMs: Number.isFinite(effectDuration) && effectDuration > 0 ? effectDuration : current.durationMs,
          delayMs: current.delayMs,
          trigger: current.trigger,
        });
      }
    }
  }
  for (const child of node.children) walkTiming(child, current, out);
}

function delayOf(node: XmlNode): number | undefined {
  const condition = descendants(node, 'p:cond')[0];
  const delay = Number(attr(condition, 'delay'));
  return Number.isFinite(delay) && delay > 0 ? delay : undefined;
}

function presetEffect(preset: number): PptAnimationEffect | undefined {
  if (preset === 1) return 'appear';
  if (preset === 2) return 'fly-in';
  if (preset === 10) return 'fade';
  if (preset === 22) return 'wipe';
  if (preset === 23) return 'zoom';
  return undefined;
}

/** Replace the slide timing tree with a simple click/after entrance sequence. */
export function applyAnimations(root: XmlNode, animations: PptAnimation[]): void {
  root.children = root.children.filter((child) => child.name !== 'p:timing');
  if (!animations.length) return;
  const pars: string[] = [];
  let id = 3;
  for (const animation of animations) {
    const filter = EFFECT_FILTER[animation.effect];
    const nodeType = animation.trigger === 'after' ? 'afterEffect' : 'clickEffect';
    const delay = animation.trigger === 'after' ? animation.delayMs : 0;
    const effectXml = filter.filter
      ? `<p:animEffect transition="in" filter="${filter.filter}"><p:cBhvr><p:cTn id="${id + 2}" dur="${animation.durationMs}"/><p:tgtEl><p:spTgt spid="${animation.targetId}"/></p:tgtEl></p:cBhvr></p:animEffect>`
      : `<p:set><p:cBhvr><p:cTn id="${id + 2}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${animation.targetId}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>`;
    pars.push(`<p:par><p:cTn id="${id}" fill="hold"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${id + 1}" presetID="${filter.preset}" presetClass="entr" fill="hold" nodeType="${nodeType}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${effectXml}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>`);
    id += 3;
  }
  const xml = `<?xml version="1.0"?><p:timing xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">`
    + `<p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>`
    + `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${pars.join('')}</p:childTnLst></p:cTn>`
    + `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>`
    + `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>`
    + `</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`;
  const timing = findChild(parseXml(xml), 'p:timing');
  if (!timing) return;
  const anchor = root.children.findIndex((item) => item.name === 'p:clrMapOvr');
  if (anchor < 0) root.children.push(timing);
  else root.children.splice(anchor + 1, 0, timing);
}

export function applyAnimation(slideRoot: XmlNode, animation: PptAnimation, existing: PptAnimation[]): PptAnimation[] {
  const next = [...existing, animation];
  applyAnimations(slideRoot, next);
  return next;
}

export function removeAnimationAt(slideRoot: XmlNode, animations: PptAnimation[], index: number): PptAnimation[] {
  const next = animations.filter((_, position) => position !== index);
  applyAnimations(slideRoot, next);
  return next;
}

export function applyTransitionToAll(roots: XmlNode[], transition: PptTransition): void {
  for (const root of roots) applyTransition(root, transition);
}

export function transitionCss(type: PptTransitionType): string {
  return type === 'none' ? '' : `op-transition-${type}`;
}

export function animationCss(effect: PptAnimationEffect): string {
  return EFFECT_CSS[effect];
}

export function transitionLabelKey(type: PptTransitionType): string {
  return `office.ppt.transition.${type}`;
}

function readDuration(node: XmlNode): number {
  const direct = Number(attr(node, 'p14:dur'));
  if (Number.isFinite(direct) && direct > 0) return direct;
  const spd = attr(node, 'spd');
  if (spd === 'slow') return 750;
  if (spd === 'fast') return 250;
  return 500;
}

export { findChildren };
