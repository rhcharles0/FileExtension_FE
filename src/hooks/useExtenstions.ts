import {
    FileExtension,
    FileExtensionResponseDto,
} from '@/types/file-extension';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import error from 'next/error';
// 💡 환경 변수에서 URL을 가져옵니다.
const BASE_URL = process.env.NEXT_PUBLIC_EXTERNAL_API_URL;
const DEFAULT_EXTENSIONS = ['bat', 'cmd', 'com', 'cpl', 'exe', 'scr', 'js'];
const API_URL = `${BASE_URL}/file-extensions`;
const MAX_CUSTOM_EXTENSIONS = 200; // 5

const ValidExtensionSchema = z
    .string()
    .max(20, { message: '20자 이하로 입력해주세요.' })
    .regex(/^[a-zA-Z0-9]+$/, {
        message: '확장자는 영문자와 숫자만 가능합니다.',
    });

const formSchema = z.object({
    customExtensionInput: z
        .union([
            z.literal(''), // 💡 빈 문자열("")은 허용
            ValidExtensionSchema, // 💡 빈 문자열이 아니면 엄격한 확장자 검사 적용
        ])
        .default(''),
});

type FormSchemaType = z.infer<typeof formSchema>;

/**
 * 1. 백엔드에서 차단 상태를 포함한 확장자 목록을 불러오는 함수
 */

const fetchExtensions = async (): Promise<FileExtensionResponseDto> => {
    try {
        // 💡 외부 URL 사용
        console.log('Fetching from URL:', API_URL);
        // fixed
        const response = await fetch(`${API_URL}/all`, {
            method: 'GET',
            // CORS 문제가 발생하면 credentials: 'include' 또는 필요한 헤더를 추가할 수 있습니다.
        });

        if (!response.ok) throw new Error('네트워크 응답 오류');
        const responseData: FileExtensionResponseDto = await response.json();

        return responseData;
    } catch (error) {
        console.error('Fetch error:', error);

        // 3. 오류 발생 시, 애플리케이션이 충돌하지 않도록 안전한 빈 구조를 반환하거나 에러를 다시 던집니다.
        // 여기서는 안전한 빈 구조(fallback)를 반환합니다.
        return {
            defaultExtensions: [],
            inputExtensions: [],
        };
    }
};

/**
 * Custom Hook: 확장자 목록 데이터와 상태를 관리
 * @returns { data: FileExtension[], isLoading: boolean, error: Error | null }
 */
export const useExtensions = () => {
    const [defaultExtensions, setDefaultExtensions] = useState<FileExtension[]>(
        []
    );
    const [isLoading, setIsLoading] = useState(true);
    const [customExtensions, setCustomExtensions] = useState<string[]>([]);
    const [addStatus, setAddStatus] = useState<'idle' | 'success' | 'error'>(
        'idle'
    );
    // useForm은 customExtensionInput만 관리

    const form = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            customExtensionInput: '',
        },
        mode: 'onChange',
    });
    const {
        getValues,
        setValue,
        setError,
        clearErrors,
        formState: { errors },
    } = form;

    useEffect(() => {
        const loadData = async () => {
            try {
                const { defaultExtensions, inputExtensions } =
                    await fetchExtensions();
                setDefaultExtensions(defaultExtensions);
                setCustomExtensions(inputExtensions.map((ext) => ext.name));
                form.setValue(
                    'customExtensionInput',
                    customExtensions.join(' ')
                );
            } catch (err) {
                console.error('초기 데이터 로드 실패:', error);
                form.reset({ customExtensionInput: '' });
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []); // 마운트 시 한 번만 실행

    // 💡 데이터 갱신 함수 (선택 사항: 업데이트 후 데이터를 다시 로드할 때 사용)
    const refetch = async () => {
        setIsLoading(true);
        try {
            const { defaultExtensions } = await fetchExtensions();
            setDefaultExtensions(defaultExtensions);
        } catch (err) {
            console.error('리패치 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };
    const refetchCustom = async () => {
        setIsLoading(true);
        try {
            const { inputExtensions } = await fetchExtensions();
            setCustomExtensions(inputExtensions.map((exe) => exe.name));
        } catch (err) {
            console.error('리패치 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };
    // --- Custom Extension 핸들러 (로직은 동일) ---
    const handleAddCustomExtension = useCallback(() => {
        form.trigger('customExtensionInput');
        const input = getValues('customExtensionInput').toLowerCase().trim();
        if (!input || errors.customExtensionInput) return;

        // 1. 유효성 검사 (빈 값 방지 및 중복 체크)
        if (!input || customExtensions.includes(input)) {
            setAddStatus('error'); // 빨간색 테두리
            return;
        }

        if (customExtensions.length >= MAX_CUSTOM_EXTENSIONS) {
            setError('customExtensionInput', {
                type: 'manual',
                message: `최대 ${MAX_CUSTOM_EXTENSIONS}개까지만 추가할 수 있습니다.`,
            });
            return;
        }

        // 💡 fixedExtensions 상태를 직접 사용하여 중복 체크
        const allExtensions = [...DEFAULT_EXTENSIONS, ...customExtensions];

        if (allExtensions.includes(input)) {
            setError('customExtensionInput', {
                type: 'manual',
                message: '이미 존재하는 확장자입니다. (고정/커스텀 목록 확인)',
            });
            return;
        }

        setCustomExtensions((prev) => [...prev, input]);
        form.resetField('customExtensionInput');

        // 3. 성공 피드백
        setAddStatus('success'); // 초록색 테두리

        clearErrors('customExtensionInput');
    }, [
        getValues,
        errors.customExtensionInput,
        customExtensions,
        setError,
        setValue,
        clearErrors,
        form,
    ]);
    const handleRemoveCustomExtension = useCallback(
        (extensionToRemove: string) => {
            setCustomExtensions((prev) =>
                prev.filter((ext) => ext !== extensionToRemove)
            );
        },
        []
    );

    // --- 폼 제출 (저장) ---
    const onSubmit = useCallback(async () => {
        // useForm의 유효성 검사 (커스텀 입력만)를 수동으로 트리거합니다.
        const inputValue = form.getValues('customExtensionInput');
        if (inputValue) {
            const isInputValid = await form.trigger('customExtensionInput');
            if (!isInputValid) return; // 유효하지 않은 값이 써있으면 중단
        }
        // 💡 fixedExtensions 상태를 직접 사용하여 전송 데이터를 만듭니다.
        const data = customExtensions;
        try {
            const response = await fetch(`${API_URL}/all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([...data]),
            });
            if (!response.ok) {
                throw new Error('설정 저장에 실패했습니다.');
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error('설정 저장 오류:', error.message);
            } else {
                console.error('설정 저장 오류:', '알 수 없는 오류 발생', error);
            }
        }
    }, [form, customExtensions]);

    return {
        defaultExtensions,
        customExtensions,
        isLoading,
        refetch,
        MAX_CUSTOM_EXTENSIONS,
        form,
        handleAddCustomExtension,
        handleRemoveCustomExtension,
        onSubmit: form.handleSubmit(onSubmit), // useForm의 handleSubmit과 결합하여 반환 };
    };
};
