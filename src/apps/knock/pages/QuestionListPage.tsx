import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { commonApi, DEFAULT_LOCALE, localeLabel, type Locale } from '../api/commonApi';
import {
    CATEGORIES,
    CATEGORY_LABELS,
    questionApi,
    type Category,
    type Question,
    type UpdateQuestionRequest,
} from '../api/questionApi';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Input, Select } from '@/shared/components/Input';
import { MultiSelect } from '@/shared/components/MultiSelect';
import { clsx } from '@/shared/lib/clsx';

type EditTarget = { mode: 'create' } | { mode: 'edit'; question: Question };

const CATEGORY_OPTIONS = CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }));

const sameCategories = (a: Category[], b: Category[]) =>
    a.length === b.length && a.every((category) => b.includes(category));

export default function QuestionListPage() {
    const [locales, setLocales] = useState<Locale[]>([DEFAULT_LOCALE]);
    const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
    const isDefaultLocale = locale === DEFAULT_LOCALE;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [draft, setDraft] = useState('');
    const [draftCategories, setDraftCategories] = useState<Category[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        commonApi
            .getSupportLanguages()
            .then(setLocales)
            .catch(() => alert('지원 언어 목록을 불러오지 못했습니다.'));
    }, []);

    // 언어를 빠르게 바꿨을 때 늦게 도착한 이전 응답이 덮어쓰지 않도록 한다.
    const latestRequest = useRef(0);

    const loadQuestions = useCallback(() => {
        const requestId = ++latestRequest.current;
        return questionApi
            .getQuestions(locale)
            .then((data) => {
                if (requestId !== latestRequest.current) return;
                setQuestions(data);
                setError(null);
            })
            .catch(() => {
                if (requestId !== latestRequest.current) return;
                setError('질문 목록을 불러오지 못했습니다.');
            })
            .finally(() => {
                if (requestId === latestRequest.current) setLoading(false);
            });
    }, [locale]);

    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);

    const changeLocale = (next: Locale) => {
        cancelEditing();
        setQuestions([]);
        setLoading(true);
        setLocale(next);
    };

    const startAdding = () => {
        if (saving || !isDefaultLocale) return;
        setEditTarget({ mode: 'create' });
        setDraft('');
        setDraftCategories([]);
    };

    const startEditing = (question: Question) => {
        if (saving) return;
        setEditTarget({ mode: 'edit', question });
        setDraft(question.content ?? '');
        setDraftCategories(question.categories ?? []);
    };

    const cancelEditing = () => {
        setEditTarget(null);
        setDraft('');
        setDraftCategories([]);
    };

    const content = draft.trim();
    const original = editTarget?.mode === 'edit' ? editTarget.question : null;
    const contentChanged = !original || content !== (original.content ?? '');
    // 한국어가 아닌 언어에서는 카테고리를 수정할 수 없다.
    const categoriesChanged =
        isDefaultLocale && (!original || !sameCategories(draftCategories, original.categories ?? []));
    // 등록은 내용·카테고리 모두 필수, 수정은 변경된 필드만 검증한다.
    const canSubmit =
        !saving &&
        !!content &&
        (contentChanged || categoriesChanged) &&
        (!categoriesChanged || draftCategories.length > 0);

    const submit = async () => {
        if (!editTarget || !canSubmit) return;

        setSaving(true);
        try {
            if (editTarget.mode === 'create') {
                await questionApi.createQuestion({ categories: draftCategories, content });
            } else {
                // 한국어가 아니면 categoriesChanged 는 항상 false 라 content 만 보낸다.
                const request: UpdateQuestionRequest = contentChanged ? { locale, content } : {};
                if (categoriesChanged) request.categories = draftCategories;
                await questionApi.updateQuestion(editTarget.question.id, request);
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

    const renderCategoryEditor = () => (
        <MultiSelect
            options={CATEGORY_OPTIONS}
            value={draftCategories}
            onChange={setDraftCategories}
            placeholder="카테고리 선택"
            disabled={saving}
        />
    );

    const renderCategories = (categories: Category[] | null) =>
        categories?.length ? (
            <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                    <Badge key={category} tone="brand">
                        {CATEGORY_LABELS[category]}
                    </Badge>
                ))}
            </div>
        ) : (
            <span className="text-slate-300">-</span>
        );

    const renderEditor = (submitLabel: string) => (
        <div className="flex items-center gap-2">
            <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isDefaultLocale ? '질문 내용을 입력하세요' : `${localeLabel(locale)} 질문을 입력하세요`}
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

    const columnCount = isDefaultLocale ? 3 : 4;

    return (
        <div className="space-y-5">
            <h1 className="text-lg font-semibold text-ink">질문 관리</h1>

            <div className="flex items-center justify-between">
                <div className="w-28">
                    <Select
                        value={locale}
                        onChange={(e) => changeLocale(e.target.value)}
                        disabled={saving}
                        aria-label="언어"
                    >
                        {locales.map((value) => (
                            <option key={value} value={value}>
                                {localeLabel(value)}
                            </option>
                        ))}
                    </Select>
                </div>
                {isDefaultLocale && (
                    <Button onClick={startAdding} disabled={editTarget?.mode === 'create' || saving}>
                        질문 추가
                    </Button>
                )}
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                {/* 한국어가 아니면 원문·번역 두 열을 같은 너비로 나누도록 고정 레이아웃을 쓴다. */}
                <table className={clsx('w-full text-left text-sm', !isDefaultLocale && 'table-fixed')}>
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="w-16 px-2 py-3 text-center">ID</th>
                            <th className="w-56 px-4 py-3">카테고리</th>
                            <th className="px-4 py-3">질문 내용</th>
                            {!isDefaultLocale && <th className="px-4 py-3">{localeLabel(locale)} 질문</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {editTarget?.mode === 'create' && (
                            <tr className="bg-brand-lightest/40">
                                <td className="whitespace-nowrap px-2 py-3 text-center text-xs text-slate-400">자동 생성</td>
                                <td className="px-4 py-2">{renderCategoryEditor()}</td>
                                <td className="px-4 py-2">{renderEditor('저장')}</td>
                            </tr>
                        )}
                        {loading ? (
                            <tr>
                                <td colSpan={columnCount} className="px-4 py-10 text-center text-slate-400">
                                    불러오는 중...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={columnCount} className="px-4 py-10 text-center text-red-500">
                                    {error}
                                </td>
                            </tr>
                        ) : questions.length === 0 && !editTarget ? (
                            <tr>
                                <td colSpan={columnCount} className="px-4 py-10 text-center text-slate-400">
                                    등록된 질문이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            questions.map((question) => {
                                const isEditing = editTarget?.mode === 'edit' && editTarget.question.id === question.id;
                                return (
                                    <tr
                                        key={question.id}
                                        onDoubleClick={isEditing ? undefined : () => startEditing(question)}
                                        title={isEditing ? undefined : '더블클릭하여 수정'}
                                        className={
                                            isEditing
                                                ? 'bg-brand-lightest/40'
                                                : 'cursor-pointer select-none hover:bg-slate-50'
                                        }
                                    >
                                        <td className="px-2 py-3 text-center text-slate-500">{question.id}</td>
                                        {isEditing && isDefaultLocale ? (
                                            <td className="px-4 py-2">{renderCategoryEditor()}</td>
                                        ) : (
                                            <td className="px-4 py-3">{renderCategories(question.categories)}</td>
                                        )}
                                        {isDefaultLocale ? (
                                            isEditing ? (
                                                <td className="px-4 py-2">{renderEditor('수정')}</td>
                                            ) : (
                                                <td className="px-4 py-3 text-ink">{question.content}</td>
                                            )
                                        ) : (
                                            <>
                                                <td className="break-words px-4 py-3 text-slate-500">{question.defaultContent}</td>
                                                {isEditing ? (
                                                    <td className="px-4 py-2">
                                                        {renderEditor(question.content ? '수정' : '등록')}
                                                    </td>
                                                ) : (
                                                    <td className="break-words px-4 py-3 text-ink">
                                                        {question.content ?? (
                                                            <span className="text-slate-300">미등록</span>
                                                        )}
                                                    </td>
                                                )}
                                            </>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
