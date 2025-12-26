'use client';

import { Checkbox } from '../ui/checkbox';
import { Label } from '../../components/ui/label';
import { useState, useEffect, useCallback } from 'react';
import { FileExtension, ItemSelections } from '../../types/file-extension';
import { useExtensions } from '../../hooks/useExtenstions';

const FIXED_EXTENSIONS = ['bat', 'cmd', 'com', 'cpl', 'exe', 'scr', 'js'];

// --- API 통신 함수  ---

// refactor: 백엔드 주소 한 곳에서 관리
const BASE_URL = process.env.NEXT_PUBLIC_EXTERNAL_API_URL;
const API_URL = `${BASE_URL}/file-extensions`;
const getItems = async (): Promise<FileExtension[]> => {
    try {
        const response = await fetch(`${API_URL}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch extensions of the file.');
        }

        // 💡 백엔드 응답 타입이 BlockedExtensionList (배열)이라고 가정
        const data: FileExtension[] = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
};

const patchItem = async (
    name: string,
    isAllowed: boolean
): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/name`, {
            // POST로 통일하여 상태 변경 요청을 보내고, body에 변경할 상태를 명시
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                isAllowed: isAllowed,
            }),
        });
        if (!response.ok) {
            throw new Error(`Backend update failed: ${response.statusText}`);
        }
        return true;
    } catch (error) {
        console.error('Backend update error:', error);
        alert(`업데이트 실패: ${name} 상태 변경에 실패했습니다.`);
        return false;
    }
};

const CheckSection = () => {
    const {
        defaultExtensions: fetched,
        isLoading: isLoading,
        refetch, // 데이터 갱신 함수 (필요한 경우)
    } = useExtensions();
    // 💡 2. UI 상태 관리
    const [selections, setSelections] = useState<ItemSelections>({});
    useEffect(() => {
        // 💡 초기 로딩이 완료되고 데이터가 있을 때만 실행
        if (!isLoading && fetched.length > 0) {
            const transformed: ItemSelections = fetched.reduce((acc, curr) => {
                acc[curr.name] = curr.isAllowed;
                return acc;
            }, {} as ItemSelections);
            setSelections(transformed);
        }
    }, [isLoading, fetched]); // 로딩 상태나 백엔드 데이터가 바뀔 때 실행

    const handleToggle = useCallback(
        async (ext: string, isChecked: boolean) => {
            // 1. UI 상태를 먼저 optimistic하게 업데이트
            setSelections((prevSelections) => ({
                ...prevSelections,
                [ext]: isChecked,
            }));

            // 2. 백엔드에 업데이트 요청 (이 함수는 백엔드 URL을 내부적으로 알고 있어야 합니다.)
            const success = await patchItem(ext, isChecked);

            if (!success) {
                await refetch(); // 변경 후 데이터 갱신
                // 3. 백엔드 업데이트 실패 시, UI 상태를 롤백
                setSelections((prevSelections) => ({
                    ...prevSelections,
                    [ext]: !isChecked,
                }));
            }
        },
        []
    );

    if (isLoading) {
        return <div className="p-4">데이터 로드 중...</div>;
    }
    return (
        <div className="flex w-full items-center gap-2">
            {FIXED_EXTENSIONS.map((ext) => (
                <div key={ext} className="flex items-center gap-3">
                    <Checkbox
                        id={ext}
                        checked={selections[ext]}
                        onCheckedChange={(state) =>
                            handleToggle(ext, state === true)
                        }
                    />

                    <Label htmlFor={ext}>{ext}</Label>
                </div>
            ))}
        </div>
    );
};

export default CheckSection;
