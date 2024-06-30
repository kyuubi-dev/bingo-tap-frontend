import { useState, useEffect } from 'react';

function useSwipe(ref) {
    const [isSwiping, setIsSwiping] = useState(false);

    useEffect(() => {
        const element = ref.current;

        if (!element) return;

        let startX = 0;
        let startY = 0;
        let startX2 = 0;
        let startY2 = 0;

        const handleTouchStart = (e) => {
            if (e.touches.length === 1) {
                setIsSwiping(true);
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;

                // Имитируем второй палец
                startX2 = startX;
                startY2 = startY + 30; // Смещаем второй палец на 30 пикселей ниже

            }
        };

        const handleTouchMove = (e) => {
            if (!isSwiping) return;

            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;

            const deltaX2 = e.touches[0].clientX - startX2;
            const deltaY2 = e.touches[0].clientY - startY2;

            // Перемещаем содержимое как будто это два пальца
            element.scrollLeft -= (deltaX + deltaX2) / 2;
            element.scrollTop -= (deltaY + deltaY2) / 2;

            // Обновляем стартовые координаты
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startX2 = e.touches[0].clientX;
            startY2 = e.touches[0].clientY + 30;

        };

        const handleTouchEnd = () => {
            setIsSwiping(false);
            element.style.backgroundColor = ''; // Возвращаем оригинальный цвет фона
        };

        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchmove', handleTouchMove);
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [ref, isSwiping]);
}

export default useSwipe;
