/**
 * Magic Sort Shen - 吉祥物 (Liyu Chill Guy) 互動與拖曳控制
 * 繁體中文註解
 * 支援全方位滑鼠與觸控拖曳移動至視窗任何角落（不含頭上對話氣泡）
 */

document.addEventListener('DOMContentLoaded', () => {
    const mascot = document.getElementById('mascot-wrapper');
    if (!mascot) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let hasMoved = false;

    // 開始拖曳處理
    function onDragStart(clientX, clientY) {
        isDragging = true;
        hasMoved = false;
        
        // 取得當前元素在視窗中的絕對像素位置
        const rect = mascot.getBoundingClientRect();
        
        // 切換為 left/top 絕對固定定位
        mascot.style.bottom = 'auto';
        mascot.style.right = 'auto';
        mascot.style.left = `${rect.left}px`;
        mascot.style.top = `${rect.top}px`;

        startX = clientX;
        startY = clientY;
        initialLeft = rect.left;
        initialTop = rect.top;

        mascot.style.transition = 'none'; // 拖曳時移除延遲感
    }

    // 拖曳移動處理
    function onDragMove(clientX, clientY) {
        if (!isDragging) return;

        const dx = clientX - startX;
        const dy = clientY - startY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            hasMoved = true;
        }

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        // 邊界防護：保持吉祥物在螢幕可視範圍內
        const mascotW = mascot.offsetWidth;
        const mascotH = mascot.offsetHeight;
        const maxLeft = window.innerWidth - mascotW - 10;
        const maxTop = window.innerHeight - mascotH - 10;

        newLeft = Math.max(10, Math.min(newLeft, maxLeft));
        newTop = Math.max(10, Math.min(newTop, maxTop));

        mascot.style.left = `${newLeft}px`;
        mascot.style.top = `${newTop}px`;
    }

    // 結束拖曳處理
    function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        mascot.style.transition = 'transform 0.15s ease-out';

        // 點擊吉祥物時播放清脆音效
        if (!hasMoved && window.soundManager) {
            window.soundManager.playSelect();
        }
    }

    // 滑鼠事件監聽
    mascot.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // 僅限左鍵
        e.preventDefault();
        onDragStart(e.clientX, e.clientY);

        function handleMouseMove(moveEvent) {
            onDragMove(moveEvent.clientX, moveEvent.clientY);
        }

        function handleMouseUp() {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            onDragEnd();
        }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    // 觸控事件監聽 (行動裝置)
    mascot.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            onDragStart(touch.clientX, touch.clientY);
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            const touch = e.touches[0];
            onDragMove(touch.clientX, touch.clientY);
        }
    }, { passive: false });

    window.addEventListener('touchend', () => {
        if (isDragging) {
            onDragEnd();
        }
    });

    // 視窗調整大小時，確保吉祥物留在畫面中
    window.addEventListener('resize', () => {
        const rect = mascot.getBoundingClientRect();
        const mascotW = mascot.offsetWidth;
        const mascotH = mascot.offsetHeight;
        let newLeft = rect.left;
        let newTop = rect.top;

        if (newLeft + mascotW > window.innerWidth) {
            newLeft = window.innerWidth - mascotW - 10;
        }
        if (newTop + mascotH > window.innerHeight) {
            newTop = window.innerHeight - mascotH - 10;
        }

        mascot.style.left = `${Math.max(10, newLeft)}px`;
        mascot.style.top = `${Math.max(10, newTop)}px`;
    });
});
