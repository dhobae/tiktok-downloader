'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';
import { MdLanguage } from 'react-icons/md';

export default function LanguageSwitcher() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const locale = useLocale();

    function onLocaleChange(newLocale: string) {
        startTransition(() => {
            router.replace(pathname, { locale: newLocale });
        });
    }

    return (
        <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700/50 p-1 px-3 shadow-lg hover:shadow-cyan-500/20 transition-all duration-300">
            <MdLanguage className="text-slate-400 w-4 h-4" />
            <select
                className="appearance-none bg-transparent text-sm font-medium text-slate-200 outline-none cursor-pointer focus:ring-0 [&>option]:bg-slate-800 disabled:opacity-50"
                defaultValue={locale}
                onChange={(e) => onLocaleChange(e.target.value)}
                disabled={isPending}
            >
                <option value="en">EN</option>
                <option value="id">ID</option>
            </select>
        </div>
    );
}
