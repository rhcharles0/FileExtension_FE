'use client';

import CheckSection from '../../components/file-extension/check-section';
import InputSection from '../../components/file-extension/input-section';

const Page = () => {
    return (
        <div className="flex justify-center w-full h-full">
            <div className="mt-10 p-5 w-120 border-gray-500 rounded-2xl border-2">
                <CheckSection />
                <InputSection />
            </div>
        </div>
    );
};

export default Page;
