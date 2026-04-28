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

import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi, beforeEach, describe, test, expect } from 'vitest';

import EditDisplayModal from '../components/EditDisplayModal';

import { mockDisplay, mockUser } from './fixtures/display';

import { UserProvider } from '@/context/UserContext';
import { testQueryClient } from '@/setupTests';

// =============================================================================
// Module mocks
// =============================================================================

vi.mock('react-i18next', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t, i18n: { changeLanguage: vi.fn() } }),
    Trans: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock('@/services/displaysApi', () => ({
  updateDisplay: vi.fn(),
  fetchDisplayVenues: vi.fn().mockResolvedValue([]),
  fetchDisplayLocales: vi.fn().mockResolvedValue([]),
  fetchDisplays: vi.fn().mockResolvedValue({ rows: [], totalCount: 0 }),
}));
vi.mock('@/services/displayProfileApi', () => ({
  fetchDisplayProfile: vi.fn().mockResolvedValue({ rows: [], totalCount: 0 }),
  fetchDisplayProfileById: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/services/folderApi', () => ({
  fetchFolderById: vi.fn().mockResolvedValue({ id: 1, text: 'Root' }),
  fetchFolderTree: vi.fn().mockResolvedValue([]),
  searchFolders: vi.fn().mockResolvedValue([]),
  fetchContextButtons: vi.fn().mockResolvedValue({ create: true }),
  selectFolder: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock('@/services/layoutsApi', () => ({
  fetchLayouts: vi.fn().mockResolvedValue({ rows: [], totalCount: 0 }),
}));
vi.mock('@/services/playerSoftwareApi', () => ({
  fetchPlayerSoftware: vi.fn().mockResolvedValue({ rows: [], totalCount: 0 }),
}));
vi.mock('@/services/daypartApi', () => ({
  fetchDaypart: vi.fn().mockResolvedValue({ rows: [], totalCount: 0 }),
}));
vi.mock('@/components/ui/modals/Modal');
vi.mock('@/components/ui/forms/SelectFolder', () => ({
  default: ({ selectedId }: { selectedId?: number | null }) => (
    <div data-testid="mock-select-folder" data-folder-id={selectedId ?? ''} />
  ),
}));

// =============================================================================
// Render helper
// =============================================================================

const renderEditModal = async (
  overrides: Partial<React.ComponentProps<typeof EditDisplayModal>> = {},
) => {
  const defaults = {
    isOpen: true,
    data: mockDisplay,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };
  const utils = render(
    <QueryClientProvider client={testQueryClient}>
      <UserProvider initialUser={mockUser}>
        <MemoryRouter>
          <EditDisplayModal {...defaults} {...overrides} />
        </MemoryRouter>
      </UserProvider>
    </QueryClientProvider>,
  );
  await screen.findByRole('dialog');
  return utils;
};

// =============================================================================
// Tests
// =============================================================================

describe('Display - edit form: Advanced tab', () => {
  beforeEach(() => {
    testQueryClient.clear();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Clear Cached Data
  // Draft initialises clearCachedData to 1 regardless of the stored value,
  // so the checkbox is always checked when the modal opens.
  // ---------------------------------------------------------------------------

  test('clear cached data checkbox is checked by default when the modal opens', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'Advanced' }));

    expect(screen.getByRole('checkbox', { name: /clear cached data/i })).toBeChecked();
  });

  test('clear cached data checkbox can be toggled', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'Advanced' }));

    const checkbox = screen.getByRole('checkbox', { name: /clear cached data/i });
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  // ---------------------------------------------------------------------------
  // Reconfigure XMR
  // ---------------------------------------------------------------------------

  // rekeyXmr is hardcoded to 0 on every modal open — it is a one-shot action,
  // not pre-populated from stored data (same pattern as clearCachedData).
  test('reconfigure XMR checkbox is unchecked by default when the modal opens', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'Advanced' }));

    expect(screen.getByRole('checkbox', { name: /reconfigure xmr/i })).not.toBeChecked();
  });

  test('reconfigure XMR checkbox can be toggled', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'Advanced' }));

    const checkbox = screen.getByRole('checkbox', { name: /reconfigure xmr/i });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  // ---------------------------------------------------------------------------
  // Skipped fields — not testable with role-based queries
  //
  // - Interleave Default (SelectDropdown): plain <div>, no ARIA role, label has
  //   no htmlFor. Flag for /review-accessibility.
  //
  // - Auditing until (DatePickerInput): renders a readonly <input type="text">
  //   with no id or aria-label — no accessible name. Flag for /review-accessibility.
  //
  // - Bandwidth limit (BandwidthInput): wraps NumberInput without a label prop
  //   and SelectDropdown for units — neither has an accessible name.
  //   Flag for /review-accessibility.
  // ---------------------------------------------------------------------------
});
