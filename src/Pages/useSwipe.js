import { useState, useEffect } from 'react';

function useSwipe(ref) {
    const [isSwiping, setIsSwiping] = useState(false);

    useEffect(() => {
        const element = ref.current;

        if (!element) return;

        let startX = 0;
        let startY = 0;

        const handleTouchStart = (e) => {
            if (e.touches.length === 1) {
                setIsSwiping(true);
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e) => {
            if (!isSwiping) return;
            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;

            // Перемещаем содержимое
            element.scrollLeft -= deltaX;
            element.scrollTop -= deltaY;

            // Обновляем стартовые координаты
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        };

        const handleTouchEnd = () => {
            setIsSwiping(false);
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
