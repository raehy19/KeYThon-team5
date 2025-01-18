// app/game/components/StartGameForm.tsx
'use client';

import { useState } from 'react';
import { startNewGame } from '@/app/game/actions';
import { useRouter } from 'next/navigation';

interface GameStartData {
  main_name: string;
  main_job: string;
  main_img: string;
  main_power?: number;
}

export default function StartGameForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<GameStartData>({
    main_name: '',
    main_job: '',
    main_img: '/characters/default.png',
    main_power: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const { game, error } = await startNewGame(formData);

      if (error) {
        setError(error);
        return;
      }

      router.refresh();
    } catch (e) {
      setError('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label htmlFor='main_name' className='block text-sm font-medium'>
          이름
        </label>
        <input
          type='text'
          id='main_name'
          name='main_name'
          value={formData.main_name}
          onChange={handleChange}
          required
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md'
        />
      </div>

      <div>
        <label htmlFor='main_job' className='block text-sm font-medium'>
          포지션
        </label>
        <select
          id='main_job'
          name='main_job'
          value={formData.main_job}
          onChange={handleChange}
          required
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md'
        >
          <option value=''>포지션을 선택하세요</option>
          <option value='메인보컬'>메인보컬</option>
          <option value='드럼'>드럼</option>
          <option value='일렉기타'>일렉기타</option>
          <option value='베이스'>베이스</option>
          <option value='키보드'>키보드</option>
        </select>
      </div>

      <button
        type='submit'
        disabled={loading}
        className='w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400'
      >
        {loading ? '게임 시작중...' : '새 게임 시작'}
      </button>

      {error && <p className='text-red-500 text-sm'>{error}</p>}
    </form>
  );
}
