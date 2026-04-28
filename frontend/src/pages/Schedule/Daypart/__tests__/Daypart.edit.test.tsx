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

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { vi, beforeEach, describe, test, expect } from 'vitest';

import type AddAndEditDaypartModalComponent from '../components/AddAndEditDaypartModal';

import { mockDaypart, SINGLE_DAYPART } from './fixtures/daypart';
import { renderDaypartPage } from './helpers/renderDaypartPage';
import { mockFetchDaypart } from './mocks/daypartApi';

import { fetchDaypart } from '@/services/daypartApi';
import { testQueryClient } from '@/setupTests';
import type { Daypart } from '@/types/daypart';

// =============================================================================
// Module mocks
// =============================================================================

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { changeLanguage: vi.fn() } }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/services/daypartApi');
vi.mock('@/services/userApi', () => ({
  fetchUserPreference: vi.fn().mockResolvedValue(null),
  saveUserPreference: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/components/ui/modals/Modal');
vi.mock('@/components/ui/modals/ShareModal', () => ({ default: () => null }));

// These tests verify page-level behaviour only: does clicking Edit open the
// modal, and does clicking Save refresh the table? Form field logic belongs in
// a separate form test, so the real modal is replaced with a minimal stub that
// acts purely as a behavioural trigger.
//
// The stub calls onSave() to simulate the user completing a save. The page's
// onSave handler ignores the argument — it only calls handleRefresh(), which
// invalidates the React Query cache. The updated row comes from the queued
// mockResolvedValueOnce response, not from anything passed to onSave.
vi.mock('../components/AddAndEditDaypartModal', () => ({
  default: ({
    data,
    onClose,
    onSave,
  }: React.ComponentProps<typeof AddAndEditDaypartModalComponent>) => (
    <div role="dialog" aria-label="Add / Edit Daypart">
      <button onClick={() => onClose()}>Cancel</button>
      <button onClick={() => onSave(data as Daypart)}>Save Daypart</button>
    </div>
  ),
}));

// =============================================================================
// Fixtures
// =============================================================================

const updatedDaypart = { ...mockDaypart, name: 'Morning - Edited' };

// =============================================================================
// Tests
// =============================================================================

describe('Daypart page - edit', () => {
  beforeEach(() => {
    testQueryClient.clear();
    vi.clearAllMocks();
    mockFetchDaypart(SINGLE_DAYPART);
  });

  // ---------------------------------------------------------------------------
  // Clicking the Edit quick action on a row opens the Edit modal.
  // ---------------------------------------------------------------------------
  test('opens the Edit modal when the Edit action is clicked on a row', async () => {
    const user = userEvent.setup();
    renderDaypartPage();

    const editButton = await screen.findByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(await screen.findByRole('dialog', { name: /add \/ edit daypart/i })).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // After the user saves their changes, the table should reload and show the
  // updated name. We also verify the page actually asked the server for fresh
  // data rather than just patching the display locally.
  // ---------------------------------------------------------------------------
  test('saving an edit refreshes the table and shows the updated row name', async () => {
    const user = userEvent.setup();
    renderDaypartPage();

    // Wait for the original row to appear before interacting.
    expect(await screen.findByText(mockDaypart.name)).toBeInTheDocument();

    const editButton = await screen.findByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Queue the updated data so the table gets it when it re-fetches after save.
    vi.mocked(fetchDaypart).mockResolvedValueOnce({
      rows: [updatedDaypart],
      totalCount: 1,
    });

    await user.click(screen.getByRole('button', { name: 'Save Daypart' }));

    // Await the new name first — this confirms the refetch completed.
    // Only then check the old name is gone, because keepPreviousData keeps the
    // old row visible during the fetch, so a synchronous negative check before
    // this point would fail.
    expect(await screen.findByText(updatedDaypart.name)).toBeInTheDocument();
    expect(screen.queryByText(mockDaypart.name)).not.toBeInTheDocument();
  });
});
