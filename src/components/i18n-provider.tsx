'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import * as React from 'react';
import { getLocaleFromUrl } from '@/lib/locale-utils';

type I18nProviderProps = {
    children: React.ReactNode;
};

function SearchParamsHandler() {
    React.useEffect(() => {
        // Only access search params on the client after mount
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const urlLocale = getLocaleFromUrl(searchParams);
            if (urlLocale && urlLocale !== i18n.language) {
                i18n.changeLanguage(urlLocale);
            }
        }
    }, []);

    return null;
}

export function I18nProvider({ children }: I18nProviderProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <I18nextProvider i18n={i18n}>
            {mounted && <SearchParamsHandler />}
            {children}
        </I18nextProvider>
    );
}
