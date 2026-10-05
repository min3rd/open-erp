/**
 * Icon registry — the ONLY place that imports `feather-icons`.
 *
 * Swapping the icon source later means editing this file alone; components keep
 * using the shared `IconName` enum and `<app-icon>`.
 *
 * feather-icons is distributed under the MIT License:
 *   Copyright (c) 2013-2023 Cole Bemis
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to
 *   deal in the Software without restriction, including without limitation the
 *   rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 *   sell copies of the Software, subject to the condition that the above
 *   copyright notice and this permission notice be included in all copies or
 *   substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
 *   WITHOUT WARRANTY OF ANY KIND.
 */
import featherIcons from 'feather-icons';
import { IconNameValue } from '../../enums';

export interface IconDefinition {
  /** Inner SVG markup, rendered inside the shared `<svg>` shell. */
  contents: string;
}

export function getIcon(name: IconNameValue): IconDefinition {
  const icon = featherIcons.icons[name];
  return icon ? { contents: icon.contents } : { contents: '' };
}
