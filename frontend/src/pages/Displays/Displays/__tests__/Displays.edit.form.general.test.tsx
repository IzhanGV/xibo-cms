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
import { axe } from 'jest-axe';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi, beforeEach, describe, test, expect } from 'vitest';

import EditDisplayModal from '../components/EditDisplayModal';

import { buildDisplay, mockDisplay, mockUser } from './fixtures/display';

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

describe('Display - edit form: General tab', () => {
  beforeEach(() => {
    testQueryClient.clear();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Display name
  // ---------------------------------------------------------------------------

  test('display name is pre-populated with the existing value', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'General' }));

    expect(screen.getByRole('textbox', { name: /^Display$/i })).toHaveValue(mockDisplay.display);
  });

  test('display name is editable and reflects typed input', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'General' }));

    const input = screen.getByRole('textbox', { name: /^Display$/i });
    await user.clear(input);
    await user.type(input, 'Updated Display');

    expect(input).toHaveValue('Updated Display');
  });

  // ---------------------------------------------------------------------------
  // Hardware Key
  // ---------------------------------------------------------------------------

  test('hardware key is pre-populated with the existing value', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ license: 'HW-KEY-001' }) });
    await user.click(screen.getByRole('button', { name: 'General' }));

    expect(screen.getByRole('textbox', { name: /hardware key/i })).toHaveValue('HW-KEY-001');
  });

  test('hardware key is editable and reflects typed input', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'General' }));

    const input = screen.getByRole('textbox', { name: /hardware key/i });
    await user.clear(input);
    await user.type(input, 'NEW-HW-KEY');

    expect(input).toHaveValue('NEW-HW-KEY');
  });

  // ---------------------------------------------------------------------------
  // Description
  // ---------------------------------------------------------------------------

  test('description is pre-populated with the existing value', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ description: 'A test description' }) });
    await user.click(screen.getByRole('button', { name: 'General' }));

    expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('A test description');
  });

  test('description is editable and reflects typed input', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'General' }));

    const input = screen.getByRole('textbox', { name: /description/i });
    await user.clear(input);
    await user.type(input, 'Updated description');

    expect(input).toHaveValue('Updated description');
  });

  // ---------------------------------------------------------------------------
  // Axe smoke test — catches missing roles, label associations, and broken
  // tab/widget patterns.
  // Expected to FAIL until SelectDropdown, TagInput, and the tab bar are fixed.
  // ---------------------------------------------------------------------------

  test.fails('General tab has no accessibility violations', async () => {
    const { container } = await renderEditModal();
    expect(await axe(container)).toHaveNoViolations();
  });

  // ---------------------------------------------------------------------------
  // Skipped fields — not testable with role-based queries
  //
  // - Tags (TagInput): renders a <label> with no htmlFor — no accessible name
  //   on the input. Flag for /review-accessibility.
  //
  // - Authorise display? (SelectDropdown): renders as a plain <div> with no
  //   ARIA role and no htmlFor on its label. Flag for /review-accessibility.
  //
  // - Default Layout (SelectDropdown): same reason as above.
  //
  // - Folder (SelectFolder): replaced by a stub in tests.
  // ---------------------------------------------------------------------------
});
