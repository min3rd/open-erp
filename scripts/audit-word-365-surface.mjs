import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync('docs/sprints/sprint_12_office_webapp/08_testing/evidence/word-365-catalog.json', 'utf8'));

const map = {
  TabHome: {
    GroupClipboard: ['mapped', 'clipboard'], GroupFont: ['mapped', 'font'], GroupParagraph: ['mapped', 'paragraph'],
    GroupStyles: ['mapped', 'styles'], GroupEditing: ['mapped', 'editing'],
    GroupAIDemo: ['service'], GroupVoiceTools: ['service'], GroupActivation: ['service'],
    GroupClassifyLabelProtect: ['service'], GroupEditor: ['service'], GroupResearch: ['service'],
    GroupOfficeExtensionsAddinFlyout: ['service'], GroupAIAssistance: ['service'],
  },
  TabInsert: {
    GroupInsertPages: ['mapped', 'pages'], GroupInsertTables: ['mapped', 'tables'],
    GroupInsertIllustrations: ['mapped', 'illustrations'], GroupMedia: ['mapped', 'media'],
    GroupInsertLinks: ['mapped', 'links'], GroupInsertComments: ['mapped', 'comments'],
    GroupHeaderFooter: ['mapped', 'headerFooter'], GroupInsertText: ['mapped', 'text'],
    GroupInsertSymbols: ['mapped', 'text'], GroupInsertBarcode: ['desktop_only'],
    GroupCollaborate: ['service'], GroupOfficeExtension: ['service'],
  },
  TabDrawInk: {
    GroupInputMode: ['partial', 'pens'], GroupWrite: ['partial', 'pens'], GroupDrawingTools: ['partial', 'pens'],
    GroupPensOneNote: ['partial', 'pens'], GroupPens2: ['partial', 'pens'], GroupDrawWithTouch: ['partial', 'pens'],
    GroupStencils: ['partial', 'pens'], GroupInkConvertOneNote: ['service'], GroupInsertDrawingCanvas: ['desktop_only'],
    InkReplay: ['desktop_only'], GroupInkClose: ['not_applicable'], GroupPenAndInkHelp: ['not_applicable'],
    GroupEditingExcel: ['mapped', 'pageBackground'],
  },
  TabWordDesign: { GroupStyleSet: ['mapped', 'documentFormatting'], GroupPageBackground: ['mapped', 'pageBackground'] },
  TabPageLayoutWord: {
    GroupPageLayoutSetup: ['partial', 'pageSetup'], GroupParagraphLayout: ['mapped', 'paragraphLayout'],
    GroupArrange: ['mapped', 'arrange'],
  },
  TabReferences: {
    GroupTableOfContents: ['mapped', 'toc'], GroupFootnotes: ['mapped', 'notes'], GroupResearch: ['service'],
    GroupCitationsAndBibliography: ['mapped', 'citations'], GroupCaptions: ['mapped', 'captions'],
    GroupIndex: ['mapped', 'index'], GroupTableOfAuthorities: ['desktop_only'], GroupAcronyms: ['service'],
  },
  TabMailings: {
    GroupEnvelopeLabelCreate: ['mapped', 'mailCreate'], GroupMailMergeStart: ['mapped', 'mailStart'],
    GroupMailMergeWriteInsertFields: ['mapped', 'mailFields'], GroupMailMergePreviewResults: ['mapped', 'mailPreview'],
    GroupMailMergeFinish: ['mapped', 'mailFinish'],
  },
  TabReviewWord: {
    GroupProofing: ['mapped', 'proofing'], GroupSpeech: ['service'], GroupAccessibility: ['mapped', 'proofing'],
    GroupLanguage: ['service'], GroupChineseTranslation: ['service'], GroupComments: ['mapped', 'reviewComments'],
    GroupChangesTracking: ['mapped', 'tracking'], GroupChanges: ['mapped', 'tracking'],
    GroupCompare: ['desktop_only'], GroupProtect: ['mapped', 'protect'], GroupInk: ['partial', 'pens'],
  },
  TabView: {
    GroupDocumentViews: ['partial', 'views'], GroupModes: ['mapped', 'views'], GroupNightMode: ['mapped', 'views'],
    GroupPageMovement: ['mapped', 'pageMovement'], GroupViewShowHide: ['mapped', 'show'],
    GroupZoom: ['mapped', 'zoomGroup'], GroupWindow: ['mapped', 'window'],
    GroupMacros: ['service'], GroupSharePointProperties: ['service'],
  },
  HelpTab: { GroupHelpAndSupport: ['mapped', 'helpGroup'] },
  TabHelp: {
    GroupBackstagePrivacy: ['not_applicable'], GroupUpdateChannel: ['service'], GroupOfficeInsider: ['not_applicable'],
    Personalization: ['not_applicable'], Theming: ['not_applicable'], ManageServices: ['service'],
    GroupBackstageIdentity: ['not_applicable'], GroupBackstageSignInDisabled: ['not_applicable'],
  },
};

/** Control-level refinements for groups the app covers with a subset of Word's controls. */
const controlStatus = {
  'TabDrawInk|GroupInputMode|InkSelect': 'mapped',
  'TabDrawInk|GroupInputMode|FingerPaintingMode': 'mapped',
  'TabDrawInk|GroupInputMode|DrawInkMode': 'mapped',
  'TabDrawInk|GroupWrite|InkSelect': 'mapped',
  'TabDrawInk|GroupWrite|FingerPaintingMode': 'mapped',
  'TabDrawInk|GroupWrite|DrawInkMode': 'mapped',
  'TabDrawInk|GroupWrite|InkEraser': 'mapped',
  'TabDrawInk|GroupWrite|InkEraserMenu': 'mapped',
  'TabDrawInk|GroupWrite|CurrentEraser': 'mapped',
  'TabDrawInk|GroupWrite|PointEraserSmall': 'mapped',
  'TabDrawInk|GroupWrite|PointEraserMedium': 'mapped',
  'TabDrawInk|GroupWrite|LassoSelect': 'mapped',
  'TabDrawInk|GroupDrawingTools|InkToolboxWithEraserAndLasso': 'mapped',
  'TabDrawInk|GroupPensOneNote|InkToolbox': 'mapped',
  'TabDrawInk|GroupPens2|PensGallery2': 'mapped',
  'TabDrawInk|GroupPens2|PenAddFavorite': 'mapped',
  'TabDrawInk|GroupPens2|InkColorPicker2': 'mapped',
  'TabDrawInk|GroupPens2|InkColorMoreColorsDialog': 'mapped',
  'TabDrawInk|GroupPens2|LineThickness2': 'mapped',
  'TabDrawInk|GroupPens2|LineStylesDialog': 'mapped',
  'TabDrawInk|GroupDrawWithTouch|FingerPaintingMode': 'mapped',
  'TabDrawInk|GroupStencils|ShowRulerStencil': 'mapped',
  'TabReviewWord|GroupInk|InkingStart': 'mapped',
  'TabReviewWord|GroupInk|HideInkSplitButton': 'mapped',
  'TabReviewWord|GroupInk|HideInk': 'mapped',
  'TabReviewWord|GroupInk|InkDeleteAll': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|PageMarginsGallery': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|MarginsCustomMargins': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|PageOrientationGallery': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|PageSizeGallery': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|PageSizeMorePaperSizesDialog': 'desktop_only',
  'TabPageLayoutWord|GroupPageLayoutSetup|TableColumnsGallery': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|ColumnsDialog': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|BreaksGallery': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|LineNumbersMenu': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|LineNumbersOff': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|LineNumbersContinuous': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|LineNumbersResetPage': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|LineNumbersResetSection': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|LineNumbersSuppress': 'desktop_only',
  'TabPageLayoutWord|GroupPageLayoutSetup|LineNumbersOptionsDialog': 'desktop_only',
  'TabPageLayoutWord|GroupPageLayoutSetup|HyphenationMenu': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|HyphenationNone': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|HyphenationAutomatic': 'mapped',
  'TabPageLayoutWord|GroupPageLayoutSetup|HyphenationManual': 'desktop_only',
  'TabPageLayoutWord|GroupPageLayoutSetup|HyphenationOptions': 'desktop_only',
  'TabPageLayoutWord|GroupPageLayoutSetup|TextDirectionGalleryWord': 'desktop_only',
  'TabPageLayoutWord|GroupPageLayoutSetup|TextDirectionOptionsDialog': 'desktop_only',
  'TabPageLayoutWord|GroupPageLayoutSetup|PageSetupDialog': 'desktop_only',
  'TabView|GroupDocumentViews|ViewFullScreenReadingView': 'mapped',
  'TabView|GroupDocumentViews|ViewPrintLayoutView': 'mapped',
  'TabView|GroupDocumentViews|ViewWebLayoutView': 'mapped',
  'TabView|GroupDocumentViews|ViewOutlineView': 'desktop_only',
  'TabView|GroupDocumentViews|ViewDraftView': 'desktop_only',
};

const totals = { client_controls: 0, mapped: 0, partial: 0, gap: 0, desktop_only: 0, service: 0, not_applicable: 0, unmapped: 0 };
const tabs = [];
const gaps = [];
const partials = [];
for (const [tab, details] of Object.entries(catalog.tabs)) {
  const tabMap = map[tab] ?? {};
  let client = 0;
  for (const [group, controls] of Object.entries(details.groups)) {
    if (group === '(none)') continue;
    const entry = tabMap[group];
    const groupStatus = entry?.[0] ?? 'unmapped';
    for (const control of controls) {
      const status = controlStatus[`${tab}|${group}|${control}`] ?? groupStatus;
      if (status === 'service') totals.service += 1;
      else if (status === 'not_applicable') totals.not_applicable += 1;
      else if (status === 'desktop_only') totals.desktop_only += 1;
      else {
        client += 1;
        totals.client_controls += 1;
        if (status === 'mapped') totals.mapped += 1;
        else if (status === 'partial') { totals.partial += 1; partials.push({ tab, group, control }); }
        else if (status === 'gap') { totals.gap += 1; gaps.push({ tab, group, control }); }
        else { totals.unmapped += 1; gaps.push({ tab, group, control, status: 'unmapped' }); }
      }
    }
  }
  tabs.push({ tab, client_controls: client });
}
const appRibbon = JSON.parse(fs.readFileSync('docs/sprints/sprint_12_office_webapp/08_testing/evidence/word-command-audit.json', 'utf8')).ribbon;
const covered = totals.mapped + totals.partial;
const report = {
  generated_at: new Date().toISOString(),
  word_365: {
    source: catalog.source,
    channel: catalog.channel,
    total_controls: catalog.total_controls,
    main_tabs: Object.keys(catalog.tabs).length,
  },
  app: { ribbon_items: appRibbon.items, tabs: appRibbon.tabs, groups: appRibbon.groups },
  control_level: {
    client_controls: totals.client_controls,
    mapped: totals.mapped,
    partial: totals.partial,
    gap: totals.gap,
    desktop_only: totals.desktop_only,
    unmapped: totals.unmapped,
    service: totals.service,
    not_applicable: totals.not_applicable,
    coverage_percent: Math.round((covered / Math.max(1, totals.client_controls)) * 1000) / 10,
    gaps,
    partial_groups: partials,
  },
  tabs,
};
fs.writeFileSync('docs/sprints/sprint_12_office_webapp/08_testing/evidence/word-365-coverage.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.control_level, null, 2));
