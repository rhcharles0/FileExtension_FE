export type ItemSelections = Record<string, boolean>;

// 백엔드 API에서 받아오는 개별 객체 타입
export type FileExtension = {
    name: string;
    isAllowed: boolean; // true: 허용됨, false: 차단됨
};

export type FileExtensionResponseDto = {
    defaultExtensions: FileExtension[]; // 백엔드에서는 "고정"을 default로 부름
    inputExtensions: FileExtension[]; // 백엔드에서는 "커스텀"을 input으로 부름
};
