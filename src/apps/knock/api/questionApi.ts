import axios from 'axios';
import type { Locale } from './commonApi';

export const CATEGORIES = ['LOVE', 'FRIENDSHIP', 'DREAM', 'CAREER'] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
    LOVE: '사랑',
    FRIENDSHIP: '우정',
    DREAM: '꿈',
    CAREER: '커리어',
};

export interface Question {
    id: number;
    categories: Category[] | null;
    /** 한국어 원문 (한국어가 아닌 locale 조회 시 사용) */
    defaultContent?: string | null;
    /** 조회한 locale 의 질문. 번역이 없으면 null */
    content: string | null;
}

export interface CreateQuestionRequest {
    categories: Category[];
    content: string;
}

/**
 * 변경된 필드만 담아 보낸다. content 를 보낼 때는 locale 이 필수이고,
 * 한국어가 아니면 categories 는 보내지 않는다.
 */
export type UpdateQuestionRequest = { categories?: Category[] } & (
    | { locale: Locale; content: string }
    | { locale?: never; content?: never }
);

const client = axios.create({
    baseURL: '/knock/admin',
});

export const questionApi = {
    getQuestions: async (locale: Locale): Promise<Question[]> => {
        const { data } = await client.get<Question[]>('/questions', { params: { locale } });
        return data;
    },
    createQuestion: async (request: CreateQuestionRequest): Promise<void> => {
        await client.post('/questions', request);
    },
    updateQuestion: async (id: number, request: UpdateQuestionRequest): Promise<void> => {
        await client.put(`/questions/${id}`, request);
    },
};
