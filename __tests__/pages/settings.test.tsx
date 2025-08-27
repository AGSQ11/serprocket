import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from '../../components/settings/Settings';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import * as ReactQuery from 'react-query';
import { dummySettings } from '../../__mocks__/data';

jest.mock('next/router', () => jest.requireActual('next-router-mock'));

describe('Settings Page', () => {
    const queryClient = new QueryClient();

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should send the correct payload when updating settings', async () => {
        const settingsWithScrapingRobot = {
            ...dummySettings,
            scraper_type: 'scrapingrobot',
            scaping_api: ['initial_key'],
            available_scapers: [{ label: 'ScrapingRobot', value: 'scrapingrobot' }],
        };

        jest.spyOn(ReactQuery, 'useQuery').mockImplementation(jest.fn().mockReturnValue(
            { data: { settings: settingsWithScrapingRobot }, isLoading: false, isSuccess: true },
        ));

        render(
            <QueryClientProvider client={queryClient}>
                <Settings closeSettings={() => { }} />
                <Toaster />
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Scraper')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Scraper'));

        await waitFor(() => {
            expect(screen.getByDisplayValue('initial_key')).toBeInTheDocument();
        });

        const addButton = screen.getByText('Add API Key');
        fireEvent.click(addButton);

        const inputs = screen.getAllByPlaceholderText('API Key/Token');
        const newKeyInput = inputs[inputs.length - 1];
        fireEvent.change(newKeyInput, { target: { value: 'new_key' } });

        fetchMock.mockResponseOnce(JSON.stringify({}));

        const saveButton = screen.getByText('Update Settings');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({
                    settings: {
                        ...settingsWithScrapingRobot,
                        scaping_api: ['initial_key', 'new_key'],
                    }
                })
            }));
        });
    });
});
