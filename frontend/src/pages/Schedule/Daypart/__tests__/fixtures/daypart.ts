/*
 * Copyright (C) 2026 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */

import type { FetchDaypartResponse } from '@/services/daypartApi';
import type { Daypart } from '@/types/daypart';
import type { User } from '@/types/user';

// -----------------------------------------------------------------------------
// Factory that produces a Daypart with safe minimal defaults.
// Only fields used in assertions carry meaningful values — everything else is
// set to the zero value for its type so the component renders without errors.
//
// dayPartId: 1   — asserted in delete tests
// name: 'Morning' — asserted in render and modal tests
// -----------------------------------------------------------------------------
export const buildDaypart = (overrides: Partial<Daypart> = {}): Daypart => ({
  dayPartId: 1,
  name: 'Morning',
  description: 'Morning shift',
  isRetired: 0,
  userId: 1,
  startTime: '08:00:00',
  endTime: '12:00:00',
  exceptions: [],
  isAlways: 0,
  isCustom: 0,
  adjustedStart: null,
  adjustedEnd: null,
  ...overrides,
});

export const mockDaypart = buildDaypart();

export const SINGLE_DAYPART: FetchDaypartResponse = {
  rows: [mockDaypart],
  totalCount: 1,
};

export const EMPTY_DAYPART_TABLE: FetchDaypartResponse = {
  rows: [],
  totalCount: 0,
};

// The default logged-in user for daypart tests.
export const mockUser: User = {
  userId: 1,
  userName: 'TestUser',
  userTypeId: 1,
  groupId: 1,
  features: {},
  settings: {
    defaultTimezone: 'UTC',
    defaultLanguage: 'en',
    DATE_FORMAT_JS: 'DD/MM/YYYY',
    TIME_FORMAT_JS: 'HH:mm',
  },
};

// Query keys that mirror what useTableState builds internally.
export const queryKeys = {
  daypartPage: ['userPref', 'daypart_page'] as const,
};
