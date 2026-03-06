import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Use setTimeout to ensure the new route has fully painted before scrolling
        setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            document.body.scrollTo({ top: 0, left: 0, behavior: 'auto' });

            // Try to find any specific scrollable major containers
            const scrollContainers = document.querySelectorAll('.overflow-y-auto');
            scrollContainers.forEach(container => container.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
        }, 10);
    }, [pathname]);

    return null;
};
