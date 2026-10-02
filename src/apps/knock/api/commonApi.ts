import axios from 'axios';

/** 서버의 지원 언어 enum 값 (예: KR, US) */
export type Locale = string;

export const DEFAULT_LOCALE: Locale = 'KR';

const LOCALE_LABELS: Record<Locale, string> = {
    KR: '한국어',
    US: '영어',
    CN: '중국어',
};

export const localeLabel = (locale: Locale) => LOCALE_LABELS[locale] ?? locale;

const client = axios.create({
    baseURL: '/knock/commons',
});

export const commonApi = {
    getSupportLanguages: async (): Promise<Locale[]> => {
        const { data } = await client.get<Locale[]>('/support-languages');
        return data;
    },
};
