import axios from 'axios';

export interface Question {
    id: number;
    content: string;
}

const client = axios.create({
    baseURL: '/knock/admin',
});

export const questionApi = {
    getQuestions: async (): Promise<Question[]> => {
        const { data } = await client.get<Question[]>('/questions');
        return data;
    },
    createQuestion: async (content: string): Promise<void> => {
        await client.post('/questions', { content });
    },
    updateQuestion: async (id: number, content: string): Promise<void> => {
        await client.put(`/questions/${id}`, { content });
    },
};
