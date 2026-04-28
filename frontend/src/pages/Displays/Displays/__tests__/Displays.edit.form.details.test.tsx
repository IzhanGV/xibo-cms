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

describe('Display - edit form: Details tab', () => {
  beforeEach(() => {
    testQueryClient.clear();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Latitude
  // ---------------------------------------------------------------------------

  test('latitude is pre-populated with the existing value', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ latitude: 51.5 }) });
    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByRole('spinbutton', { name: /latitude/i })).toHaveValue(51.5);
  });

  test('latitude is editable and reflects typed input', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'Details' }));

    const input = screen.getByRole('spinbutton', { name: /latitude/i });
    await user.clear(input);
    await user.type(input, '48');

    expect(input).toHaveValue(48);
  });

  // ---------------------------------------------------------------------------
  // Longitude
  // ---------------------------------------------------------------------------

  test('longitude is pre-populated with the existing value', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ longitude: -0.1 }) });
    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByRole('spinbutton', { name: /longitude/i })).toHaveValue(-0.1);
  });

  test('longitude is editable and reflects typed input', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'Details' }));

    const input = screen.getByRole('spinbutton', { name: /longitude/i });
    await user.clear(input);
    await user.type(input, '2');

    expect(input).toHaveValue(2);
  });

  // ---------------------------------------------------------------------------
  // Address
  // ---------------------------------------------------------------------------

  test('address is pre-populated with the existing value', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ address: '123 Main St' }) });
    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByRole('textbox', { name: /address/i })).toHaveValue('123 Main St');
  });

  test('address is editable and reflects typed input', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'Details' }));

    const input = screen.getByRole('textbox', { name: /address/i });
    await user.clear(input);
    await user.type(input, '456 New Road');

    expect(input).toHaveValue('456 New Road');
  });

  // ---------------------------------------------------------------------------
  // Screen size
  // ---------------------------------------------------------------------------

  test('screen size is pre-populated with the existing value', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ screenSize: 55 }) });
    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByRole('spinbutton', { name: /screen size/i })).toHaveValue(55);
  });

  test('screen size is editable and reflects typed input', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'Details' }));

    const input = screen.getByRole('spinbutton', { name: /screen size/i });
    await user.clear(input);
    await user.type(input, '75');

    expect(input).toHaveValue(75);
  });

  // ---------------------------------------------------------------------------
  // Is mobile?
  // ---------------------------------------------------------------------------

  test('is mobile checkbox reflects the existing value', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ isMobile: 1 }) });
    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByRole('checkbox', { name: /is mobile/i })).toBeChecked();
  });

  test('is mobile checkbox can be toggled', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ isMobile: 0 }) });
    await user.click(screen.getByRole('button', { name: 'Details' }));

    const checkbox = screen.getByRole('checkbox', { name: /is mobile/i });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  // ---------------------------------------------------------------------------
  // Is outdoor?
  // ---------------------------------------------------------------------------

  test('is outdoor checkbox reflects the existing value', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ isOutdoor: 1 }) });
    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByRole('checkbox', { name: /is outdoor/i })).toBeChecked();
  });

  test('is outdoor checkbox can be toggled', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ isOutdoor: 0 }) });
    await user.click(screen.getByRole('button', { name: 'Details' }));

    const checkbox = screen.getByRole('checkbox', { name: /is outdoor/i });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  // ---------------------------------------------------------------------------
  // Cost per play
  // ---------------------------------------------------------------------------

  test('cost per play is pre-populated with the existing value', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ costPerPlay: 2.5 }) });
    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByRole('spinbutton', { name: /cost per play/i })).toHaveValue(2.5);
  });

  test('cost per play is editable and reflects typed input', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'Details' }));

    const input = screen.getByRole('spinbutton', { name: /cost per play/i });
    await user.clear(input);
    await user.type(input, '5');

    expect(input).toHaveValue(5);
  });

  // ---------------------------------------------------------------------------
  // Impressions per play
  // ---------------------------------------------------------------------------

  test('impressions per play is pre-populated with the existing value', async () => {
    const user = userEvent.setup();
    await renderEditModal({ data: buildDisplay({ impressionsPerPlay: 100 }) });
    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByRole('spinbutton', { name: /impressions per play/i })).toHaveValue(100);
  });

  test('impressions per play is editable and reflects typed input', async () => {
    const user = userEvent.setup();
    await renderEditModal();
    await user.click(screen.getByRole('button', { name: 'Details' }));

    const input = screen.getByRole('spinbutton', { name: /impressions per play/i });
    await user.clear(input);
    await user.type(input, '200');

    expect(input).toHaveValue(200);
  });

  // ---------------------------------------------------------------------------
  // Skipped fields — not testable with role-based queries
  //
  // - Timezone (TimezoneSelect): wraps SelectDropdown — plain <div>, no ARIA
  //   role, label has no htmlFor. Flag for /review-accessibility.
  //
  // - Languages (MultiSelectDropdown): same reason as above.
  //
  // - Display Type (SelectDropdown): same reason as above.
  //
  // - Venue (SelectDropdown): same reason as above.
  // ---------------------------------------------------------------------------
});
