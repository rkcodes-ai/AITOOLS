import React, { useState } from 'react';
import { BiSolidUpArrow } from 'react-icons/bi';
import { AiFillCaretDown } from 'react-icons/ai';

const DropdownMenuWithSelectedValue = ({
  data,
  selectedItem,
  setSelectedItem,
  article,
  setArticle,
  isLanguageArray,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative flex flex-col gap-5 items-center max-w-xs w-[45%] rounded-lg ${!isLanguageArray && 'mx-auto'}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-slate-200 hover:bg-slate-300 p-3 w-full flex items-center justify-between font-semibold text-sm rounded-lg border-2 text-gray-800 border-transparent active:border-black duration-200 text-left transition-colors"
      >
        <span>
          {selectedItem || (isLanguageArray ? 'Choose Language' : 'Choose Action')}
        </span>
        {isOpen ? <BiSolidUpArrow className="text-xs" /> : <AiFillCaretDown className="text-xs" />}
      </button>

      {isOpen && (
        <div className="bg-white shadow-xl border border-gray-200 absolute top-14 flex flex-col items-start rounded-lg p-1.5 w-full mb-5 z-30 max-h-64 overflow-y-auto">
          {!isLanguageArray &&
            data.map((opt, index) => (
              <button
                type="button"
                key={index}
                onClick={() => {
                  setSelectedItem(opt);
                  setIsOpen(false);
                }}
                className="flex w-full justify-between hover:bg-gray-100 cursor-pointer rounded-md p-2.5 text-sm font-medium text-gray-800 text-left transition-colors"
              >
                {opt}
              </button>
            ))}

          {isLanguageArray &&
            data.map((opt, index) => (
              <button
                type="button"
                key={index}
                onClick={() => {
                  setSelectedItem(opt.code);
                  setIsOpen(false);
                  if (setArticle && article) {
                    setArticle({ ...article, language: opt.code });
                  }
                }}
                className="flex w-full justify-between hover:bg-gray-100 cursor-pointer rounded-md p-2.5 text-sm font-medium text-gray-800 text-left transition-colors"
              >
                <span>{opt.language}</span>
                <span className="text-gray-400 font-mono text-xs uppercase">{opt.code}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenuWithSelectedValue;