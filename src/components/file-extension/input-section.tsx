'use client';
// 1. 고정 확장자 목록
import { useExtensions } from '@/hooks/useExtenstions';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField, // 커스텀 입력에만 사용
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { X, Loader2 } from 'lucide-react';

const InputSection = () => {
    const {
        form,
        isLoading,
        customExtensions,
        MAX_CUSTOM_EXTENSIONS,
        handleAddCustomExtension,
        handleRemoveCustomExtension,
        onSubmit,
    } = useExtensions();
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-12 h-64 border rounded-lg max-w-2xl bg-white shadow-lg">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <p>설정 데이터를 불러오는 중...</p>
            </div>
        );
    }
    return (
        <div className="w-full ">
            <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="flex items-start space-x-4 pt-4">
                        <div className="flex flex-col w-full space-y-2">
                            <FormField
                                control={form.control}
                                name="customExtensionInput" // 💡 useForm이 관리하는 필드
                                render={({ field }) => (
                                    <FormItem className="flex items-start space-x-2 w-full relative">
                                        <div className="flex items-center space-x-2 w-full">
                                            <FormControl className="w-48">
                                                <Input
                                                    placeholder="확장자 입력"
                                                    {...field}
                                                    className="w-full"
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                onClick={
                                                    handleAddCustomExtension
                                                }
                                                variant="outline"
                                                className="bg-gray-100 hover:bg-gray-200 hover:cursor-pointer"
                                            >
                                                +추가
                                            </Button>
                                        </div>
                                        <FormMessage className="absolute top-full left-0 mt-1" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* 3. 커스텀 확장자 태그 목록 (useState로 관리) */}
                    <div className="flex space-x-4">
                        <FormLabel className="text-base mt-2 whitespace-nowrap">
                            {customExtensions.length}/{MAX_CUSTOM_EXTENSIONS}
                        </FormLabel>
                        <div className="w-full h-32 border border-gray-300 p-3 rounded overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                                {customExtensions.map((ext) => (
                                    <span
                                        key={ext}
                                        className="inline-flex items-center bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full whitespace-nowrap"
                                    >
                                        {ext}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveCustomExtension(ext)
                                            }
                                            className="ml-1 text-gray-500 hover:text-red-600 hover:cursor-pointer"
                                            title="삭제"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 4. 제출 버튼 */}
                    <div className="pt-4 flex justify-end">
                        <Button
                            type="submit"
                            variant="default"
                            className="hover:cursor-pointer"
                        >
                            설정 저장
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default InputSection;
