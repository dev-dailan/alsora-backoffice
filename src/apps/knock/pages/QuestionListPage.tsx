import { useCallback, useEffect, useState, type KeyboardEvent } from 'react';
import { questionApi, type Question } from '../api/questionApi';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

type EditTarget = { mode: 'create' } | { mode: 'edit'; id: number; original: string };

export default function QuestionListPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);

    const loadQuestions = useCallback(() => {
        return questionApi
            .getQuestions()
            .then((data) => {
                setQuestions(data);
                setError(null);
            })
            .catch(() => setError('질문 목록을 불러오지 못했습니다.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);

    const startAdding = () => {
        if (saving) return;
        setEditTarget({ mode: 'create' });
        setDraft('');
    };

    const startEditing = (question: Question) => {
        if (saving) return;
        setEditTarget({ mode: 'edit', id: question.id, original: question.content });
        setDraft(question.content);
    };

    const cancelEditing = () => {
        setEditTarget(null);
        setDraft('');
    };

    const content = draft.trim();
    const canSubmit =
        !saving && !!content && !(editTarget?.mode === 'edit' && content === editTarget.original);

    const submit = async () => {
        if (!editTarget || !canSubmit) return;

        setSaving(true);
        try {
            if (editTarget.mode === 'create') {
                await questionApi.createQuestion(content);
            } else {
                await questionApi.updateQuestion(editTarget.id, content);
            }
            cancelEditing();
            await loadQuestions();
        } catch {
            alert(editTarget.mode === 'create' ? '질문을 등록하지 못했습니다.' : '질문을 수정하지 못했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') cancelEditing();
    };

    const renderEditor = (submitLabel: string) => (
        <div className="flex items-center gap-2">
            <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="질문 내용을 입력하세요"
                disabled={saving}
            />
            <Button onClick={submit} disabled={!canSubmit} className="shrink-0">
                {submitLabel}
            </Button>
            <Button variant="secondary" onClick={cancelEditing} disabled={saving} className="shrink-0">
                취소
            </Button>
        </div>
    );

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-ink">질문 관리</h1>
                </div>
                <Button onClick={startAdding} disabled={editTarget?.mode === 'create' || saving}>
                    질문 추가
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="w-24 px-4 py-3">ID</th>
                            <th className="px-4 py-3">질문 내용</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {editTarget?.mode === 'create' && (
                            <tr className="bg-brand-lightest/40">
                                <td className="px-4 py-3 text-xs text-slate-400">자동 생성</td>
                                <td className="px-4 py-2">{renderEditor('저장')}</td>
                            </tr>
                        )}
                        {loading ? (
                            <tr>
                                <td colSpan={2} className="px-4 py-10 text-center text-slate-400">
                                    불러오는 중...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={2} className="px-4 py-10 text-center text-red-500">
                                    {error}
                                </td>
                            </tr>
                        ) : questions.length === 0 && !editTarget ? (
                            <tr>
                                <td colSpan={2} className="px-4 py-10 text-center text-slate-400">
                                    등록된 질문이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            questions.map((question) =>
                                editTarget?.mode === 'edit' && editTarget.id === question.id ? (
                                    <tr key={question.id} className="bg-brand-lightest/40">
                                        <td className="px-4 py-3 text-slate-500">{question.id}</td>
                                        <td className="px-4 py-2">{renderEditor('수정')}</td>
                                    </tr>
                                ) : (
                                    <tr
                                        key={question.id}
                                        onDoubleClick={() => startEditing(question)}
                                        title="더블클릭하여 수정"
                                        className="cursor-pointer select-none hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 text-slate-500">{question.id}</td>
                                        <td className="px-4 py-3 text-ink">{question.content}</td>
                                    </tr>
                                ),
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
