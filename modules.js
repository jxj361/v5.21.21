// ========== modules.js — 扩展功能模块 ==========

// ========== 音乐播放器与页面 ==========
function getCurrentPlaylist() { return appData.musicPlaylists[musicCurrentPlaylistIndex]; }
function getCurrentSongs() { const pl = getCurrentPlaylist(); return pl ? pl.songs : []; }

function openMusicPage(chatId) {
    document.getElementById('chatsPage').classList.remove('active'); document.getElementById('chatPage').classList.remove('active'); document.getElementById('contactsPage').classList.remove('active'); document.getElementById('contactDetailPage').classList.remove('active'); document.getElementById('discoverPage').classList.remove('active'); document.getElementById('momentsPage').classList.remove('active'); document.getElementById('mePage').classList.remove('active');
    document.getElementById('musicPage').classList.add('active');
    renderMusicPage();
}

function renderMusicPage() {
    const body = document.getElementById('musicPageContent'); while (body.firstChild) body.removeChild(body.firstChild);
    const pl = getCurrentPlaylist();
    const plRow = document.createElement('div'); plRow.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;';
    const plSelect = document.createElement('select'); plSelect.id = 'musicPlSelect';
    appData.musicPlaylists.forEach((pl, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = pl.name + ' (' + pl.songs.length + ')'; if (i === musicCurrentPlaylistIndex) opt.selected = true; plSelect.appendChild(opt); });
    plSelect.onchange = () => { musicCurrentPlaylistIndex = parseInt(plSelect.value); musicCurrentSongIndex = -1; stopMusic(); renderMusicPage(); };
    plRow.appendChild(plSelect);
    const newPlBtn = document.createElement('button'); newPlBtn.className = 'btn'; newPlBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>歌单';
    newPlBtn.onclick = () => { showInputDialog('新建歌单', '歌单名', (name) => { if (name && !appData.musicPlaylists.some(p => p.name === name)) { appData.musicPlaylists.push({ name, songs: [] }); markDataChanged(); save(); renderMusicPage(); } else { toast('歌单名重复或为空'); } }); };
    plRow.appendChild(newPlBtn);
    if (appData.musicPlaylists.length > 1) { const delPlBtn = document.createElement('button'); delPlBtn.className = 'btn'; delPlBtn.textContent = '删除歌单'; delPlBtn.onclick = () => { showConfirm('删除当前歌单？歌曲不会丢失，可先导出备份', () => { if (appData.musicPlaylists.length <= 1) { toast('至少保留一个歌单'); return; } appData.musicPlaylists.splice(musicCurrentPlaylistIndex, 1); musicCurrentPlaylistIndex = 0; markDataChanged(); save(); renderMusicPage(); }); }; plRow.appendChild(delPlBtn); }
    body.appendChild(plRow);

    const searchRow = document.createElement('div'); searchRow.className = 'search-row';
    const musicSearchInput = document.createElement('input'); musicSearchInput.id = 'musicSearchInput'; musicSearchInput.placeholder = '搜索歌名/歌手...'; musicSearchInput.oninput = () => { renderMusicList(document.getElementById('musicListContainer')); };
    searchRow.appendChild(musicSearchInput); body.appendChild(searchRow);

    const actionRow = document.createElement('div'); actionRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';
    const addBtn = document.createElement('button'); addBtn.className = 'btn'; addBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>添加歌曲'; addBtn.onclick = addMusicItem;
    const importBtn = document.createElement('button'); importBtn.className = 'btn'; importBtn.style.cssText = 'display:flex;align-items:center;';
    importBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('download')}</svg>文件导入`;
    importBtn.onclick = () => document.getElementById('musicFileInput').click();

    const pasteBtn = document.createElement('button'); pasteBtn.className = 'btn'; pasteBtn.style.cssText = 'display:flex;align-items:center;';
    pasteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('clipboard')}</svg>粘贴导入`;
    pasteBtn.onclick = pasteMusicImport;

    const exportBtn = document.createElement('button'); exportBtn.className = 'btn'; exportBtn.style.cssText = 'display:flex;align-items:center;';
    exportBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('upload')}</svg>导出`;
    exportBtn.onclick = exportMusicPlaylist;
    actionRow.appendChild(addBtn); actionRow.appendChild(importBtn); actionRow.appendChild(pasteBtn); actionRow.appendChild(exportBtn);
    body.appendChild(actionRow);

    const batchRow = document.createElement('div'); batchRow.style.cssText = 'display:flex;gap:6px;align-items:center;';
    const batchDeleteBtn = document.createElement('button'); batchDeleteBtn.className = 'btn'; batchDeleteBtn.style.cssText = 'display:flex;align-items:center;color:#f44336;';
    batchDeleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="margin-right:4px;">${getIconSVG('trash-2')}</svg>批量删除选中`;
    batchDeleteBtn.onclick = () => { const songs = getCurrentSongs(); const selected = songs.filter((s, idx) => selectedMusicSongs.has(idx)); if (selected.length === 0) { toast('请先选择歌曲'); return; } showConfirm(`删除选中的 ${selected.length} 首歌曲？`, () => { for (let i = songs.length - 1; i >= 0; i--) { if (selectedMusicSongs.has(i)) songs.splice(i, 1); } selectedMusicSongs.clear(); if (musicCurrentSongIndex >= songs.length) stopMusic(); markDataChanged(); save(); renderMusicPage(); updateMusicFloatUI(); }); };
    const selectAllCheck = document.createElement('input'); selectAllCheck.type = 'checkbox'; selectAllCheck.id = 'musicSelectAll';
    selectAllCheck.onchange = () => { const songs = getCurrentSongs(); if (selectAllCheck.checked) { songs.forEach((s, i) => selectedMusicSongs.add(i)); } else { selectedMusicSongs.clear(); } renderMusicList(document.getElementById('musicListContainer')); };
    batchRow.appendChild(selectAllCheck); batchRow.appendChild(document.createTextNode('全选 ')); batchRow.appendChild(batchDeleteBtn);
    body.appendChild(batchRow);

    const infoDiv = document.createElement('div'); infoDiv.className = 'music-info'; infoDiv.id = 'musicInfoDiv'; infoDiv.textContent = '未在播放'; body.appendChild(infoDiv);
    const controlsDiv = document.createElement('div'); controlsDiv.className = 'music-controls';
    const prevBtn = document.createElement('button'); prevBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:4px;font-size:24px;line-height:1;color:var(--theme);';
    prevBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>';
    prevBtn.onclick = musicPrev;
    const playBtn = document.createElement('button'); playBtn.id = 'musicPlayBtn'; playBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:4px;font-size:24px;line-height:1;color:var(--theme);';
    playBtn.innerHTML = musicIsPlaying
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    playBtn.onclick = musicTogglePlay;
    const nextBtn = document.createElement('button'); nextBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:4px;font-size:24px;line-height:1;color:var(--theme);';
    nextBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>';
    nextBtn.onclick = musicNext;
    const modeBtn = document.createElement('button'); modeBtn.id = 'musicModeBtn'; modeBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:4px;font-size:24px;line-height:1;color:var(--theme);';
    if (musicMode === 'single') {
        modeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><rect x="10" y="12" width="4" height="4" rx="1"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
    } else if (musicMode === 'random') {
        modeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>';
    } else {
        modeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
    }
    modeBtn.onclick = musicCycleMode;
    controlsDiv.appendChild(prevBtn); controlsDiv.appendChild(playBtn); controlsDiv.appendChild(nextBtn); controlsDiv.appendChild(modeBtn);
    body.appendChild(controlsDiv);
    const volumeRow = document.createElement('div'); volumeRow.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 12px;';
    volumeRow.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:var(--theme);">${getIconSVG('volume-2')}</svg>`;
    const slider = document.createElement('input'); slider.type = 'range'; slider.id = 'musicVolumeSlider'; slider.min = '0'; slider.max = '100'; slider.value = '100';
    slider.style.cssText = 'flex:1;height:6px;background:var(--theme-light);border-radius:3px;outline:none;-webkit-appearance:none;appearance:none;';
    const label = document.createElement('span'); label.id = 'musicVolumeLabel'; label.textContent = '100%';
    label.style.cssText = 'min-width:40px;text-align:center;font-size:13px;font-weight:500;color:var(--theme-dark);';
    volumeRow.appendChild(slider); volumeRow.appendChild(label);
    body.appendChild(volumeRow);
    setTimeout(() => { const sliderEl = document.getElementById('musicVolumeSlider'); if (sliderEl) { sliderEl.oninput = () => { const vol = parseInt(sliderEl.value) / 100; document.getElementById('musicVolumeLabel').textContent = Math.round(vol * 100) + '%'; if (musicAudio) musicAudio.volume = vol; }; } }, 100);
    const listDiv = document.createElement('div'); listDiv.className = 'music-list'; listDiv.id = 'musicListContainer';
    renderMusicList(listDiv);
    body.appendChild(listDiv);
    const countDiv = document.createElement('div'); countDiv.style.cssText = 'text-align:center;font-size:12px;color:var(--text-secondary);'; countDiv.textContent = `共 ${getCurrentSongs().length} 首歌曲`;
    body.appendChild(countDiv);
    updateMusicFloatUI();
}

function renderMusicList(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
    const songs = getCurrentSongs();
    const kw = (document.getElementById('musicSearchInput')?.value || '').toLowerCase();
    const filtered = kw ? songs.filter(s => s.title.toLowerCase().includes(kw) || (s.sub || '').toLowerCase().includes(kw)) : songs;
    filtered.forEach((song, idx) => {
        const realIdx = songs.indexOf(song);
        const item = document.createElement('div');
        item.className = 'music-item' + (realIdx === musicCurrentSongIndex ? ' playing' : '');
        item.style.cssText = 'display:flex;align-items:center;padding:10px;border-bottom:1px solid var(--border-light);';
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'music-checkbox'; checkbox.checked = selectedMusicSongs.has(realIdx);
        checkbox.style.cssText = 'flex-shrink:0;margin-right:8px;';
        checkbox.onchange = () => { if (checkbox.checked) selectedMusicSongs.add(realIdx); else selectedMusicSongs.delete(realIdx); };
        item.appendChild(checkbox);
        const idxSpan = document.createElement('span'); idxSpan.className = 'song-index'; idxSpan.style.cssText = 'width:30px;text-align:center;font-size:12px;color:var(--text-secondary);flex-shrink:0;';
        idxSpan.textContent = (realIdx + 1) + '.'; item.appendChild(idxSpan);
        const infoSpan = document.createElement('span'); infoSpan.className = 'song-info'; infoSpan.style.cssText = 'flex:1;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;user-select:none;-webkit-user-select:none;touch-action:manipulation;';
        infoSpan.innerHTML = `<span>${escapeHtml(song.title)} - ${escapeHtml(song.sub)}</span>`;
        infoSpan.onclick = () => musicPlayIndex(realIdx, true);
        let songLongPressTimer;
        infoSpan.addEventListener('touchstart', () => { songLongPressTimer = setTimeout(() => editMusicSong(realIdx), 600); });
        infoSpan.addEventListener('touchend', () => clearTimeout(songLongPressTimer));
        infoSpan.addEventListener('touchmove', () => clearTimeout(songLongPressTimer));
        item.appendChild(infoSpan);
        const actionsSpan = document.createElement('span'); actionsSpan.className = 'song-actions'; actionsSpan.style.cssText = 'position:relative;display:inline-flex;align-items:center;flex-shrink:0;margin-left:8px;';
        const moreBtn = document.createElement('button'); moreBtn.className = 'btn'; moreBtn.style.cssText = 'font-size:16px;padding:2px 6px;display:inline-flex;align-items:center;vertical-align:middle;border:none;background:transparent;cursor:pointer;';
        moreBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">${getIconSVG('more-vertical')}</svg>`;
        moreBtn.onclick = (e) => {
            e.stopPropagation();
            const existingMenu = moreBtn.parentElement.querySelector('.music-actions-menu');
            if (existingMenu) { existingMenu.remove(); return; }
            document.querySelectorAll('.music-actions-menu').forEach(m => m.remove());
            const menu = document.createElement('div'); menu.className = 'music-actions-menu';
            menu.style.cssText = 'position:absolute;right:0;top:100%;z-index:200;background:var(--secondary-bg);border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:4px;display:flex;flex-direction:column;min-width:90px;';
            const moveItem = document.createElement('button'); moveItem.className = 'btn'; moveItem.style.cssText = 'font-size:12px;padding:6px 10px;display:flex;align-items:center;gap:4px;border:none;background:none;cursor:pointer;';
            moveItem.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('move')}</svg> 移动`;
            moveItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); moveMusicSong(realIdx); };
            const shareItem = document.createElement('button'); shareItem.className = 'btn'; shareItem.style.cssText = 'font-size:12px;padding:6px 10px;display:flex;align-items:center;gap:4px;border:none;background:none;cursor:pointer;';
            shareItem.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('share-2')}</svg> 分享`;
            shareItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); shareMusicSong(song); };
            const deleteItem = document.createElement('button'); deleteItem.className = 'btn'; deleteItem.style.cssText = 'font-size:12px;padding:6px 10px;display:flex;align-items:center;gap:4px;border:none;background:none;cursor:pointer;color:#f44336;';
            deleteItem.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('trash-2')}</svg> 删除`;
            deleteItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); deleteMusicSong(realIdx); };
            menu.appendChild(moveItem); menu.appendChild(shareItem); menu.appendChild(deleteItem);
            moreBtn.parentElement.appendChild(menu);
            const closeHandler = (ev) => { if (!menu.contains(ev.target) && ev.target !== moreBtn) { menu.remove(); document.removeEventListener('click', closeHandler); } };
            setTimeout(() => document.addEventListener('click', closeHandler), 10);
        };
        actionsSpan.appendChild(moreBtn);
        item.appendChild(actionsSpan);
        container.appendChild(item);
    });
    if (filtered.length === 0) container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:20px">暂无歌曲</div>';
}

function moveMusicSong(fromIdx) { const songs = getCurrentSongs(); const song = songs[fromIdx]; const otherPlaylists = appData.musicPlaylists.filter((p, i) => i !== musicCurrentPlaylistIndex); if (otherPlaylists.length === 0) { toast('没有其他歌单'); return; } const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '移动到歌单'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; otherPlaylists.forEach(pl => { const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;'; btn.textContent = pl.name; btn.onclick = () => { pl.songs.push({ ...song }); songs.splice(fromIdx, 1); if (musicCurrentSongIndex === fromIdx) stopMusic(); else if (musicCurrentSongIndex > fromIdx) musicCurrentSongIndex--; markDataChanged(); save(); overlay.remove(); if (document.getElementById('musicPage').classList.contains('active')) renderMusicPage(); updateMusicFloatUI(); toast('已移动'); }; body.appendChild(btn); }); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function addMusicItem() { const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '300px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '添加歌曲'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; body.innerHTML = `<input id="musicTitle" placeholder="歌名" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;"><input id="musicSub" placeholder="演唱者" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;"><input id="musicUrl" placeholder="网易云外链" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;">`; card.appendChild(body); const footer = document.createElement('div'); footer.className = 'pop-footer'; const saveBtn = document.createElement('button'); saveBtn.className = 'btn-primary'; saveBtn.textContent = '保存'; saveBtn.onclick = () => { const title = document.getElementById('musicTitle').value.trim(); const sub = document.getElementById('musicSub').value.trim(); const url = document.getElementById('musicUrl').value.trim(); if (!title || !url) { toast('歌名和链接不能为空'); return; } const songs = getCurrentSongs(); if (songs.some(s => s.title === title && s.sub === sub && s.url === url)) { toast('此歌曲已存在，已跳过'); overlay.remove(); return; } songs.push({ title, sub, url }); markDataChanged(); save(); overlay.remove(); if (document.getElementById('musicPage').classList.contains('active')) renderMusicPage(); updateMusicFloatUI(); toast('歌曲已添加'); }; footer.appendChild(saveBtn); card.appendChild(footer); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function pasteMusicImport() { showInputDialogRaw('粘贴导入歌曲', '每行格式：歌名/演唱者/链接 或三行一组，两行则默认歌名+链接', (text) => { if (!text.trim()) { toast('未输入内容'); return; } const lines = text.split('\n').map(l => l.trim()).filter(Boolean); let added = 0, skipped = 0; let i = 0; while (i < lines.length) { const first = lines[i] || ''; const second = lines[i + 1] || ''; const third = lines[i + 2] || ''; if (third && (third.startsWith('http://') || third.startsWith('https://'))) { if (first && third) { const songs = getCurrentSongs(); if (!songs.some(s => s.title === first && s.sub === second && s.url === third)) { songs.push({ title: first, sub: second, url: third }); added++; } else { skipped++; } } i += 3; } else if (second && (second.startsWith('http://') || second.startsWith('https://'))) { if (first && second) { const songs = getCurrentSongs(); if (!songs.some(s => s.title === first && s.sub === '' && s.url === second)) { songs.push({ title: first, sub: '', url: second }); added++; } else { skipped++; } } i += 2; } else { i++; } } markDataChanged(); save(); let msg = `导入 ${added} 首歌曲`; if (skipped > 0) msg += `，重复 ${skipped} 首已跳过`; toast(msg); if (document.getElementById('musicPage').classList.contains('active')) renderMusicPage(); updateMusicFloatUI(); }); }

function editMusicSong(idx) { const songs = getCurrentSongs(); if (idx < 0 || idx >= songs.length) return; const song = songs[idx]; const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '300px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '编辑歌曲'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; body.innerHTML = `<input id="editSongTitle" value="${escapeHtml(song.title)}" placeholder="歌名" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;margin-bottom:6px;"><input id="editSongSub" value="${escapeHtml(song.sub || '')}" placeholder="演唱者" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;margin-bottom:6px;"><input id="editSongUrl" value="${escapeHtml(song.url || '')}" placeholder="链接" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;">`; card.appendChild(body); const footer = document.createElement('div'); footer.className = 'pop-footer'; const saveBtn = document.createElement('button'); saveBtn.className = 'btn-primary'; saveBtn.textContent = '保存'; saveBtn.onclick = () => { const newTitle = document.getElementById('editSongTitle').value.trim(); const newSub = document.getElementById('editSongSub').value.trim(); const newUrl = document.getElementById('editSongUrl').value.trim(); if (!newTitle) { toast('歌名不能为空'); return; } if (!newUrl) { toast('链接不能为空'); return; } song.title = newTitle; song.sub = newSub; song.url = newUrl; markDataChanged(); save(); overlay.remove(); if (document.getElementById('musicPage').classList.contains('active')) renderMusicPage(); updateMusicFloatUI(); toast('歌曲信息已更新'); }; footer.appendChild(saveBtn); card.appendChild(footer); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function deleteMusicSong(idx) { showConfirm('删除这首歌？', () => { getCurrentSongs().splice(idx, 1); if (musicCurrentSongIndex === idx) { stopMusic(); } else if (musicCurrentSongIndex > idx) musicCurrentSongIndex--; markDataChanged(); save(); if (document.getElementById('musicPage').classList.contains('active')) renderMusicPage(); updateMusicFloatUI(); }); }
function shareMusicSong(song) { if (!song || !song.title) return; const contacts = appData.users.filter(u => !u.members); if (!contacts.length) { toast('没有联系人'); return; } const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '分享给梦角'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; contacts.forEach(c => { const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;'; btn.textContent = c.name; btn.onclick = () => { addMessage(c.id, { text: `🎵 ${appData.myProfile.name} 分享了一首歌《${song.title}》${song.sub ? '-' + song.sub : ''}`, type: 'system', me: true, time: new Date().toISOString() }); overlay.remove(); const choiceOverlay = document.createElement('div'); choiceOverlay.className = 'mask show'; const choiceCard = document.createElement('div'); choiceCard.className = 'pop-card'; choiceCard.style.width = '280px'; const choiceHeader = document.createElement('div'); choiceHeader.className = 'pop-header'; choiceHeader.textContent = '分享成功'; choiceCard.appendChild(choiceHeader); const choiceBody = document.createElement('div'); choiceBody.className = 'pop-body'; choiceBody.style.textAlign = 'center'; const stayBtn = document.createElement('button'); stayBtn.className = 'btn'; stayBtn.textContent = '留在当前页面'; stayBtn.onclick = () => { choiceOverlay.remove(); }; const chatBtn = document.createElement('button'); chatBtn.className = 'btn-primary'; chatBtn.textContent = '去聊天界面'; chatBtn.onclick = () => { choiceOverlay.remove(); document.querySelectorAll('.mask.show').forEach(m => m.remove()); currentChatId = c.id; hideAllPages(); openChat(); }; choiceBody.appendChild(stayBtn); choiceBody.appendChild(chatBtn); choiceCard.appendChild(choiceBody); choiceOverlay.appendChild(choiceCard); document.body.appendChild(choiceOverlay); choiceOverlay.addEventListener('click', e => { if (e.target === choiceOverlay) choiceOverlay.remove(); }); }; body.appendChild(btn); }); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }

let _musicFileBusy = false;
document.getElementById('musicFileInput').addEventListener('change', function(e) { if (_musicFileBusy) return; const file = e.target.files[0]; if (!file) return; _musicFileBusy = true; const reader = new FileReader(); reader.onload = function(ev) { try { const content = ev.target.result; let added = 0, skipped = 0; if (file.name.endsWith('.json')) { try { const arr = JSON.parse(content); if (Array.isArray(arr)) { const songs = getCurrentSongs(); arr.forEach(song => { if (song.title && song.url) { const sub = song.sub || ''; if (!songs.some(s => s.title === song.title && s.sub === sub && s.url === song.url)) { songs.push({ title: song.title, sub, url: song.url }); added++; } else { skipped++; } } }); } } catch { toast('JSON格式错误'); _musicFileBusy = false; return; } } else { const lines = content.split('\n').map(l => l.trim()).filter(Boolean); const songs = getCurrentSongs(); let i = 0; while (i < lines.length) { const first = lines[i] || ''; const second = lines[i + 1] || ''; const third = lines[i + 2] || ''; if (third && (third.startsWith('http://') || third.startsWith('https://'))) { if (first && third) { if (!songs.some(s => s.title === first && s.sub === second && s.url === third)) { songs.push({ title: first, sub: second, url: third }); added++; } else { skipped++; } } i += 3; } else if (second && (second.startsWith('http://') || second.startsWith('https://'))) { if (first && second) { if (!songs.some(s => s.title === first && s.sub === '' && s.url === second)) { songs.push({ title: first, sub: '', url: second }); added++; } else { skipped++; } } i += 2; } else { i++; } } } markDataChanged(); save(); let msg = `导入 ${added} 首歌曲`; if (skipped > 0) msg += `，重复 ${skipped} 首已跳过`; toast(msg); if (document.getElementById('musicPage').classList.contains('active')) renderMusicPage(); updateMusicFloatUI(); } catch (e) { toast('导入失败，文件可能已损坏'); } _musicFileBusy = false; }; reader.onerror = function() { toast('文件读取失败'); _musicFileBusy = false; }; reader.readAsText(file); this.value = ''; });
function exportMusicPlaylist() { const songs = getCurrentSongs(); const pl = getCurrentPlaylist(); const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '导出格式'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; const jsonBtn = document.createElement('button'); jsonBtn.className = 'btn-primary'; jsonBtn.textContent = '导出 JSON'; jsonBtn.onclick = () => { const blob = new Blob([JSON.stringify(songs.map(s => ({ title: s.title, sub: s.sub, url: s.url })))], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${pl.name}.json`; a.click(); URL.revokeObjectURL(a.href); overlay.remove(); }; const txtBtn = document.createElement('button'); txtBtn.className = 'btn-primary'; txtBtn.textContent = '导出 TXT'; txtBtn.onclick = () => { const txt = songs.map(s => `${s.title}\n${s.sub}\n${s.url}`).join('\n'); const blob = new Blob([txt], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${pl.name}.txt`; a.click(); URL.revokeObjectURL(a.href); overlay.remove(); }; body.appendChild(jsonBtn); body.appendChild(txtBtn); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }

function autoAdvance() { const songs = getCurrentSongs(); if (songs.length === 0) return; let nextIdx; if (musicMode === 'random') { nextIdx = Math.floor(Math.random() * songs.length); } else { nextIdx = (musicCurrentSongIndex + 1) % songs.length; } musicPlayIndex(nextIdx, false); }

function musicPlayIndex(idx, userInitiated = false) { const songs = getCurrentSongs(); if (idx < 0 || idx >= songs.length) return; musicCurrentSongIndex = idx; const song = songs[idx]; if (userInitiated) { musicFailCount = 0; musicAutoSkipPaused = false; } if (musicAdvanceTimer) { clearTimeout(musicAdvanceTimer); musicAdvanceTimer = null; } const oldAudio = musicAudio; if (oldAudio) { oldAudio.onerror = null; oldAudio.onended = null; oldAudio.onloadeddata = null; oldAudio.oncanplay = null; oldAudio.pause(); musicAudio = null; } const audio = new Audio(song.url); musicAudio = audio; audio._handled = false; function handleFatalError(reason) { if (audio._handled) return; audio._handled = true; musicFailCount++; if (musicAutoSkipPaused) { toast('播放失败，自动切换已暂停'); musicIsPlaying = false; updateMusicUI(); updateMusicFloatUI(); return; } if (musicFailCount >= 3) { musicAutoSkipPaused = true; toast('连续多首播放失败，已暂停自动切换'); musicIsPlaying = false; updateMusicUI(); updateMusicFloatUI(); return; } toast(reason || '播放失败，即将切换下一首', 1500); musicAdvanceTimer = setTimeout(() => { musicAdvanceTimer = null; if (audio._handled) { autoAdvance(); } }, 400); } audio.onerror = () => { if (audio._handled) return; handleFatalError('链接无效或格式不支持'); }; audio.onended = () => { if (audio._handled) return; if (musicMode === 'single') { musicPlayIndex(idx, false); } else { autoAdvance(); } }; const volSlider = document.getElementById('musicVolumeSlider'); if (volSlider) audio.volume = parseInt(volSlider.value) / 100; audio.play().then(() => { if (audio._handled) return; musicIsPlaying = true; updateMusicUI(); updateMusicFloatUI(); }).catch((e) => { if (audio._handled) return; if (e && e.name === 'NotAllowedError') { toast('播放被浏览器阻止，请点击播放按钮'); audio._handled = true; musicIsPlaying = false; updateMusicUI(); updateMusicFloatUI(); return; } if (e && e.name === 'AbortError') { audio._handled = true; musicIsPlaying = false; updateMusicUI(); updateMusicFloatUI(); return; } handleFatalError('播放失败'); }); if (document.getElementById('musicPage').classList.contains('active')) { document.getElementById('musicInfoDiv').textContent = `${song.title} - ${song.sub}`; } updateMusicFloatUI(); }
function musicTogglePlay() { if (!musicAudio && musicCurrentSongIndex >= 0) { musicPlayIndex(musicCurrentSongIndex, true); return; } if (!musicAudio) return; if (musicIsPlaying) { musicAudio.pause(); musicIsPlaying = false; } else { musicAudio.play().then(() => { musicIsPlaying = true; }).catch((e) => { if (e && (e.name === 'NotAllowedError' || e.name === 'AbortError')) {} else { toast('播放失败'); } }); } updateMusicUI(); }
function musicNext() { const songs = getCurrentSongs(); if (songs.length === 0) return; if (musicMode === 'random') { musicCurrentSongIndex = Math.floor(Math.random() * songs.length); } else { musicCurrentSongIndex = (musicCurrentSongIndex + 1) % songs.length; } musicPlayIndex(musicCurrentSongIndex, true); }
function musicPrev() { const songs = getCurrentSongs(); if (songs.length === 0) return; musicCurrentSongIndex = (musicCurrentSongIndex - 1 + songs.length) % songs.length; musicPlayIndex(musicCurrentSongIndex, true); }
function musicCycleMode() { if (musicMode === 'list') musicMode = 'single'; else if (musicMode === 'single') musicMode = 'random'; else musicMode = 'list'; const modeBtn = document.getElementById('musicModeBtn'); if (modeBtn) { if (musicMode === 'list') modeBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('repeat')}</svg>`; else if (musicMode === 'single') modeBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('repeat-1')}</svg>`; else modeBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('shuffle')}</svg>`; } }
function stopMusic() { if (musicAudio) { musicAudio.pause(); musicAudio = null; } musicIsPlaying = false; musicCurrentSongIndex = -1; updateMusicUI(); updateMusicFloatUI(); }
function updateMusicUI() { const playBtn = document.getElementById('musicPlayBtn'); if (playBtn) { if (musicIsPlaying) { playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; } else { playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>'; } } if (document.getElementById('musicPage').classList.contains('active')) { const listContainer = document.getElementById('musicListContainer'); if (listContainer) renderMusicList(listContainer); } updateMusicFloatUI(); }

// ========== 音乐悬浮窗 ==========
function updateMusicFloatUI() { const ball = document.getElementById('musicFloatBall'); const list = document.getElementById('musicFloatList'); const bar = document.getElementById('musicFloatBar'); if (!ball || !list || !bar) return; const songs = getCurrentSongs(); const currentLeft = ball.style.left || ''; const currentTop = ball.style.top || ''; ball.style.display = 'none'; list.style.display = 'none'; bar.style.display = 'none'; if (!musicFloatVisible) return; if (currentMusicFloatState === 'ball') { ball.style.display = 'flex'; if (currentLeft) { ball.style.left = currentLeft; ball.style.top = currentTop; ball.style.right = 'auto'; ball.style.bottom = 'auto'; } ball.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'; } else if (currentMusicFloatState === 'list') { list.style.display = 'flex'; if (currentLeft) { list.style.left = currentLeft; list.style.top = currentTop; list.style.right = 'auto'; list.style.bottom = 'auto'; } const header = list.querySelector('.float-list-header') || (() => { const h = document.createElement('div'); h.className = 'float-list-header'; list.appendChild(h); const body = document.createElement('div'); body.className = 'float-list-body'; list.appendChild(body); return h; })(); const body = list.querySelector('.float-list-body'); header.innerHTML = ''; const plSelect = document.createElement('select'); plSelect.style.cssText = 'font-size:11px;background:var(--theme);color:white;border:none;'; appData.musicPlaylists.forEach((pl, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = pl.name + ' (' + pl.songs.length + ')'; if (i === musicCurrentPlaylistIndex) opt.selected = true; plSelect.appendChild(opt); }); plSelect.onchange = (e) => { e.stopPropagation(); musicCurrentPlaylistIndex = parseInt(plSelect.value); musicCurrentSongIndex = -1; stopMusic(); updateMusicFloatUI(); }; header.appendChild(plSelect); const addPlBtn = document.createElement('button'); addPlBtn.className = 'btn'; addPlBtn.style.cssText = 'font-size:9px;padding:1px 4px;background:white;color:var(--theme);'; addPlBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'; addPlBtn.onclick = (e) => { e.stopPropagation(); showInputDialog('新建歌单', '歌单名', (name) => { if (name && !appData.musicPlaylists.some(p => p.name === name)) { appData.musicPlaylists.push({ name, songs: [] }); markDataChanged(); save(); updateMusicFloatUI(); } else { toast('歌单名重复或为空'); } }); }; header.appendChild(addPlBtn); if (appData.musicPlaylists.length > 1) { const delPlBtn = document.createElement('button'); delPlBtn.className = 'btn'; delPlBtn.style.cssText = 'font-size:9px;padding:1px 4px;background:white;color:#f44336;'; delPlBtn.textContent = '-'; delPlBtn.onclick = (e) => { e.stopPropagation(); showConfirm('删除当前歌单？', () => { if (appData.musicPlaylists.length <= 1) { toast('至少保留一个歌单'); return; } appData.musicPlaylists.splice(musicCurrentPlaylistIndex, 1); musicCurrentPlaylistIndex = 0; markDataChanged(); save(); updateMusicFloatUI(); }); }; header.appendChild(delPlBtn); } const closeSpan = document.createElement('span'); closeSpan.textContent = '▼'; closeSpan.style.cursor = 'pointer'; closeSpan.onclick = (e) => { e.stopPropagation(); currentMusicFloatState = 'ball'; updateMusicFloatUI(); }; header.appendChild(closeSpan); let searchRow2 = body.querySelector('.music-float-search-row'); if (!searchRow2) { searchRow2 = document.createElement('div'); searchRow2.className = 'music-float-search-row'; searchRow2.style.cssText = 'padding:4px;'; const searchInput2 = document.createElement('input'); searchInput2.type = 'text'; searchInput2.placeholder = '搜索...'; searchInput2.style.cssText = 'width:100%;font-size:10px;padding:2px 4px;border-radius:8px;border:1px solid var(--border-light);'; searchInput2.oninput = () => renderMusicFloatListBody(body, songs); searchRow2.appendChild(searchInput2); body.appendChild(searchRow2); } const keepSelectors = ['.float-list-header', '.music-float-search-row', '.float-collapse-row']; Array.from(body.children).forEach(child => { const shouldKeep = keepSelectors.some(sel => child.matches(sel) || child.querySelector(sel)); if (!shouldKeep) child.remove(); }); renderMusicFloatListBody(body, songs); const existingCollapse = body.querySelector('.float-collapse-row'); if (existingCollapse) body.appendChild(existingCollapse); let collapseRow = body.querySelector('.float-collapse-row'); if (!collapseRow) { collapseRow = document.createElement('div'); collapseRow.className = 'float-collapse-row'; collapseRow.style.cssText = 'position:sticky;bottom:0;text-align:right;padding:2px 4px;background:var(--secondary-bg);border-top:1px solid var(--border-light);'; const collapseBtn = document.createElement('button'); collapseBtn.className = 'btn'; collapseBtn.style.cssText = 'font-size:14px;padding:2px 8px;'; collapseBtn.textContent = '▲'; collapseBtn.onclick = (e) => { e.stopPropagation(); currentMusicFloatState = 'ball'; updateMusicFloatUI(); }; collapseRow.appendChild(collapseBtn); body.appendChild(collapseRow); } } else if (currentMusicFloatState === 'bar') { bar.style.display = 'flex'; if (currentLeft) { bar.style.left = currentLeft; bar.style.top = currentTop; bar.style.right = 'auto'; bar.style.bottom = 'auto'; } const song = musicCurrentSongIndex >= 0 ? songs[musicCurrentSongIndex] : null; bar.innerHTML = ''; const prevBtn2 = document.createElement('button'); prevBtn2.style.cssText = 'background:none;border:none;cursor:pointer;padding:2px;color:var(--theme);display:flex;align-items:center;'; prevBtn2.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('skip-back')}</svg>`; prevBtn2.onclick = (e) => { e.stopPropagation(); musicPrev(); }; const playBtn2 = document.createElement('button'); playBtn2.style.cssText = 'background:none;border:none;cursor:pointer;padding:2px;color:var(--theme);display:flex;align-items:center;'; playBtn2.innerHTML = musicIsPlaying ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('pause')}</svg>` : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('play')}</svg>`; playBtn2.onclick = (e) => { e.stopPropagation(); musicTogglePlay(); }; const nextBtn2 = document.createElement('button'); nextBtn2.style.cssText = 'background:none;border:none;cursor:pointer;padding:2px;color:var(--theme);display:flex;align-items:center;'; nextBtn2.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('skip-forward')}</svg>`; nextBtn2.onclick = (e) => { e.stopPropagation(); musicNext(); }; const infoDiv2 = document.createElement('div'); infoDiv2.className = 'bar-info'; infoDiv2.textContent = song ? `${song.title} - ${song.sub}` : '未播放'; infoDiv2.onclick = (e) => { e.stopPropagation(); currentMusicFloatState = 'list'; updateMusicFloatUI(); }; const closeBtn2 = document.createElement('button'); closeBtn2.style.cssText = 'background:none;border:none;cursor:pointer;padding:2px;color:var(--theme);display:flex;align-items:center;'; closeBtn2.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('x')}</svg>`; closeBtn2.onclick = (e) => { e.stopPropagation(); showConfirm('关闭悬浮窗？', () => { stopMusic(); currentMusicFloatState = 'ball'; updateMusicFloatUI(); }); }; bar.appendChild(prevBtn2); bar.appendChild(playBtn2); bar.appendChild(nextBtn2); bar.appendChild(infoDiv2); bar.appendChild(closeBtn2); } }

function renderMusicFloatListBody(body, songs) { let listContainer = body.querySelector('#musicFloatListItems'); if (!listContainer) { listContainer = document.createElement('div'); listContainer.id = 'musicFloatListItems'; body.appendChild(listContainer); } else { while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild); } const searchInput2 = body.querySelector('input[type="text"]'); const kw = searchInput2?.value?.toLowerCase() || ''; const filtered = kw ? songs.filter(s => s.title.toLowerCase().includes(kw) || (s.sub || '').toLowerCase().includes(kw)) : songs; filtered.forEach((s, idx) => { const realIdx = songs.indexOf(s); const item = document.createElement('div'); item.className = 'float-list-item' + (realIdx === musicCurrentSongIndex ? ' playing' : ''); item.style.cssText = 'display:flex;align-items:center;padding:6px 8px;gap:6px;'; const idxSpan = document.createElement('span'); idxSpan.style.cssText = 'flex-shrink:0;font-size:11px;color:var(--text-secondary);min-width:20px;'; idxSpan.textContent = (realIdx + 1) + '.'; item.appendChild(idxSpan); const infoSpan = document.createElement('span'); infoSpan.style.cssText = 'flex:1;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;cursor:pointer;'; infoSpan.textContent = s.title + (s.sub ? ' - ' + s.sub : ''); infoSpan.onclick = (e) => { e.stopPropagation(); musicPlayIndex(realIdx, true); }; item.appendChild(infoSpan); const actions = document.createElement('span'); actions.style.cssText = 'position:relative;display:inline-flex;align-items:center;flex-shrink:0;'; const moreBtn = document.createElement('button'); moreBtn.className = 'btn'; moreBtn.style.cssText = 'font-size:14px;padding:1px 4px;display:inline-flex;align-items:center;border:none;background:transparent;cursor:pointer;'; moreBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">${getIconSVG('more-vertical')}</svg>`; moreBtn.onclick = (e) => { e.stopPropagation(); const existingMenu = moreBtn.parentElement.querySelector('.music-float-actions-menu'); if (existingMenu) { existingMenu.remove(); return; } document.querySelectorAll('.music-float-actions-menu').forEach(m => m.remove()); const menu = document.createElement('div'); menu.className = 'music-float-actions-menu'; menu.style.cssText = 'position:absolute;right:0;top:100%;z-index:200;background:var(--secondary-bg);border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.2);padding:3px;display:flex;flex-direction:column;min-width:70px;'; const moveItem = document.createElement('button'); moveItem.className = 'btn'; moveItem.style.cssText = 'font-size:10px;padding:4px 8px;display:flex;align-items:center;gap:3px;border:none;background:none;cursor:pointer;'; moveItem.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('move')}</svg> 移动`; moveItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); moveMusicSong(realIdx); }; const shareItem = document.createElement('button'); shareItem.className = 'btn'; shareItem.style.cssText = 'font-size:10px;padding:4px 8px;display:flex;align-items:center;gap:3px;border:none;background:none;cursor:pointer;'; shareItem.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('share-2')}</svg> 分享`; shareItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); shareMusicSong(s); }; const deleteItem = document.createElement('button'); deleteItem.className = 'btn'; deleteItem.style.cssText = 'font-size:10px;padding:4px 8px;display:flex;align-items:center;gap:3px;border:none;background:none;cursor:pointer;color:#f44336;'; deleteItem.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('trash-2')}</svg> 删除`; deleteItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); deleteMusicSong(realIdx); }; menu.appendChild(moveItem); menu.appendChild(shareItem); menu.appendChild(deleteItem); moreBtn.parentElement.appendChild(menu); const closeHandler = (ev) => { if (!menu.contains(ev.target) && ev.target !== moreBtn) { menu.remove(); document.removeEventListener('click', closeHandler); } }; setTimeout(() => document.addEventListener('click', closeHandler), 10); }; actions.appendChild(moreBtn); item.appendChild(actions); listContainer.appendChild(item); }); const oldModeRow = body.querySelector('.float-mode-row'); if (oldModeRow) oldModeRow.remove(); const oldVolRow = body.querySelector('.float-vol-row'); if (oldVolRow) oldVolRow.remove(); const oldOpRow = body.querySelector('.float-op-row'); if (oldOpRow) oldOpRow.remove(); const modeRow = document.createElement('div'); modeRow.className = 'float-mode-row'; modeRow.style.cssText = 'padding:4px;display:flex;gap:4px;'; [{ icon: 'repeat', mode: 'list' }, { icon: 'repeat-1', mode: 'single' }, { icon: 'shuffle', mode: 'random' }].forEach(mb => { const b = document.createElement('button'); b.className = 'btn'; b.style.cssText = 'font-size:10px;padding:2px 6px;display:inline-flex;align-items:center;'; b.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG(mb.icon)}</svg>`; b.onclick = (e) => { e.stopPropagation(); musicMode = mb.mode; updateMusicFloatUI(); }; if (musicMode === mb.mode) b.style.background = 'var(--theme-light)'; modeRow.appendChild(b); }); body.appendChild(modeRow); const volRow = document.createElement('div'); volRow.className = 'float-vol-row'; volRow.style.cssText = 'padding:4px;display:flex;align-items:center;gap:6px;'; volRow.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">${getIconSVG('volume-2')}</svg>`; const volSlider = document.createElement('input'); volSlider.type = 'range'; volSlider.min = '0'; volSlider.max = '100'; volSlider.value = '100'; volSlider.style.cssText = 'flex:1;height:4px;background:var(--theme-light);border-radius:2px;outline:none;-webkit-appearance:none;appearance:none;'; volSlider.oninput = (e) => { e.stopPropagation(); if (musicAudio) musicAudio.volume = parseInt(volSlider.value) / 100; }; volRow.appendChild(volSlider); body.appendChild(volRow); const opRow = document.createElement('div'); opRow.className = 'float-op-row'; opRow.style.cssText = 'padding:4px;display:flex;gap:4px;'; const addBtn2 = document.createElement('button'); addBtn2.className = 'btn'; addBtn2.style.cssText = 'font-size:10px;padding:2px 6px;display:inline-flex;align-items:center;'; addBtn2.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px;">${getIconSVG('plus')}</svg>添加`; addBtn2.onclick = (e) => { e.stopPropagation(); addMusicItem(); }; const pasteBtn2 = document.createElement('button'); pasteBtn2.className = 'btn'; pasteBtn2.style.cssText = 'font-size:10px;padding:2px 6px;display:inline-flex;align-items:center;'; pasteBtn2.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px;">${getIconSVG('clipboard')}</svg>粘贴`; pasteBtn2.onclick = (e) => { e.stopPropagation(); pasteMusicImport(); }; const fileBtn = document.createElement('button'); fileBtn.className = 'btn'; fileBtn.style.cssText = 'font-size:10px;padding:2px 6px;display:inline-flex;align-items:center;'; fileBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px;">${getIconSVG('download')}</svg>文件`; fileBtn.onclick = (e) => { e.stopPropagation(); document.getElementById('musicFileInput').click(); }; const exportBtn2 = document.createElement('button'); exportBtn2.className = 'btn'; exportBtn2.style.cssText = 'font-size:10px;padding:2px 6px;display:inline-flex;align-items:center;'; exportBtn2.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px;">${getIconSVG('upload')}</svg>导出`; exportBtn2.onclick = (e) => { e.stopPropagation(); exportMusicPlaylist(); }; opRow.appendChild(addBtn2); opRow.appendChild(pasteBtn2); opRow.appendChild(fileBtn); opRow.appendChild(exportBtn2); body.appendChild(opRow); const existingCollapse = body.querySelector('.float-collapse-row'); if (existingCollapse) existingCollapse.remove(); const collapseRow = document.createElement('div'); collapseRow.className = 'float-collapse-row'; collapseRow.style.cssText = 'position:sticky;bottom:0;text-align:right;padding:2px 4px;background:var(--secondary-bg);border-top:1px solid var(--border-light);'; const collapseBtn = document.createElement('button'); collapseBtn.className = 'btn'; collapseBtn.style.cssText = 'font-size:14px;padding:2px 8px;'; collapseBtn.textContent = '▲'; collapseBtn.onclick = (e) => { e.stopPropagation(); currentMusicFloatState = 'ball'; updateMusicFloatUI(); }; collapseRow.appendChild(collapseBtn); body.appendChild(collapseRow); }

function setupFloatDrag(el, state) { let dragOff = null; el.addEventListener('pointerdown', (e) => { if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return; e.preventDefault(); dragOff = { x: e.clientX - el.offsetLeft, y: e.clientY - el.offsetTop }; el.setPointerCapture(e.pointerId); const move = (ev) => { el.style.left = (ev.clientX - dragOff.x) + 'px'; el.style.top = (ev.clientY - dragOff.y) + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; }; const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); const rect = el.getBoundingClientRect(); const minVisible = 20; const elWidth = el.offsetWidth || 55; const elHeight = el.offsetHeight || 55; if (rect.left < -(elWidth - minVisible)) el.style.left = -(elWidth - minVisible) + 'px'; if (rect.right > window.innerWidth + (elWidth - minVisible)) el.style.left = (window.innerWidth - minVisible) + 'px'; if (rect.top < -(elHeight - minVisible)) el.style.top = -(elHeight - minVisible) + 'px'; if (rect.bottom > window.innerHeight + (elHeight - minVisible)) el.style.top = (window.innerHeight - minVisible) + 'px'; }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); }); el.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return; if (state === 'ball') { currentMusicFloatState = 'list'; updateMusicFloatUI(); } else if (state === 'list') { currentMusicFloatState = 'bar'; updateMusicFloatUI(); } else if (state === 'bar') { currentMusicFloatState = 'ball'; updateMusicFloatUI(); } }); }

function createMusicFloatElements() { const ball = document.createElement('div'); ball.className = 'music-float-ball'; ball.id = 'musicFloatBall'; ball.style.bottom = '80px'; ball.style.right = '16px'; document.body.appendChild(ball); const list = document.createElement('div'); list.className = 'music-float-list'; list.id = 'musicFloatList'; list.style.bottom = '80px'; list.style.right = '16px'; document.body.appendChild(list); const bar = document.createElement('div'); bar.className = 'music-float-bar'; bar.id = 'musicFloatBar'; bar.style.bottom = '8px'; bar.style.left = '8px'; document.body.appendChild(bar); setupFloatDrag(ball, 'ball'); setupFloatDrag(list, 'list'); setupFloatDrag(bar, 'bar'); }

function toggleMusicFloat() { musicFloatVisible = !musicFloatVisible; if (musicFloatVisible) { currentMusicFloatState = 'ball'; updateMusicFloatUI(); setTimeout(positionFloatBalls, 100); } else { document.getElementById('musicFloatBall').style.display = 'none'; document.getElementById('musicFloatList').style.display = 'none'; document.getElementById('musicFloatBar').style.display = 'none'; } }

// ========== 书单列表 ==========
function getCurrentBookList() { return appData.bookLists[currentBookListIndex]; }
function getCurrentBooks() { const bl = getCurrentBookList(); return bl ? bl.books : []; }
function openBookListPage() { hideAllPages(); document.getElementById('bookListPage').classList.add('active'); document.getElementById('bookListTitle').textContent = '书单列表'; renderBookListPage(); }
function renderBookListPage() { const body = document.getElementById('bookListPageContent'); while (body.firstChild) body.removeChild(body.firstChild); const bl = getCurrentBookList(); const plRow = document.createElement('div'); plRow.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;'; const plSelect = document.createElement('select'); plSelect.id = 'bookPlSelect'; appData.bookLists.forEach((l, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = l.name + ' (' + l.books.length + ')'; if (i === currentBookListIndex) opt.selected = true; plSelect.appendChild(opt); }); plSelect.onchange = () => { currentBookListIndex = parseInt(plSelect.value); renderBookListPage(); }; plRow.appendChild(plSelect); const newPlBtn = document.createElement('button'); newPlBtn.className = 'btn'; newPlBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>书单'; newPlBtn.onclick = () => { showInputDialog('新建书单', '书单名', (name) => { if (name && !appData.bookLists.some(p => p.name === name)) { appData.bookLists.push({ name, books: [] }); markDataChanged(); save(); renderBookListPage(); } else { toast('书单名重复或为空'); } }); }; plRow.appendChild(newPlBtn); if (appData.bookLists.length > 1) { const delPlBtn = document.createElement('button'); delPlBtn.className = 'btn'; delPlBtn.textContent = '删除书单'; delPlBtn.onclick = () => { showConfirm('删除当前书单？', () => { if (appData.bookLists.length <= 1) { toast('至少保留一个书单'); return; } appData.bookLists.splice(currentBookListIndex, 1); currentBookListIndex = 0; markDataChanged(); save(); renderBookListPage(); }); }; plRow.appendChild(delPlBtn); } body.appendChild(plRow); const searchRow = document.createElement('div'); searchRow.className = 'search-row'; const bookSearchInput = document.createElement('input'); bookSearchInput.id = 'bookSearchInput'; bookSearchInput.placeholder = '搜索书名/作者...'; bookSearchInput.oninput = () => { renderBookList(document.getElementById('bookListContainer')); }; searchRow.appendChild(bookSearchInput); body.appendChild(searchRow); const actionRow = document.createElement('div'); actionRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;'; const addBtn = document.createElement('button'); addBtn.className = 'btn'; addBtn.style.cssText = 'display:inline-flex;align-items:center;'; addBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('plus')}</svg>添加书籍`; addBtn.onclick = addBookItem; const importBtn = document.createElement('button'); importBtn.className = 'btn'; importBtn.style.cssText = 'display:inline-flex;align-items:center;'; importBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('download')}</svg>文件导入`; importBtn.onclick = () => document.getElementById('bookFileInput').click(); const pasteBtn = document.createElement('button'); pasteBtn.className = 'btn'; pasteBtn.style.cssText = 'display:inline-flex;align-items:center;'; pasteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('clipboard')}</svg>粘贴导入`; pasteBtn.onclick = pasteBookImport; const exportBtn = document.createElement('button'); exportBtn.className = 'btn'; exportBtn.style.cssText = 'display:inline-flex;align-items:center;'; exportBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('upload')}</svg>导出`; exportBtn.onclick = exportBookList; actionRow.appendChild(addBtn); actionRow.appendChild(importBtn); actionRow.appendChild(pasteBtn); actionRow.appendChild(exportBtn); body.appendChild(actionRow); const batchRow = document.createElement('div'); batchRow.style.cssText = 'display:flex;gap:6px;align-items:center;'; const batchDeleteBtn = document.createElement('button'); batchDeleteBtn.className = 'btn'; batchDeleteBtn.style.cssText = 'color:#f44336;display:inline-flex;align-items:center;'; batchDeleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="margin-right:4px;">${getIconSVG('trash-2')}</svg>批量删除选中`; batchDeleteBtn.onclick = () => { const books = getCurrentBooks(); const selected = books.filter((b, idx) => selectedBooks.has(idx)); if (selected.length === 0) { toast('请先选择书籍'); return; } showConfirm(`删除选中的 ${selected.length} 本书？`, () => { for (let i = books.length - 1; i >= 0; i--) { if (selectedBooks.has(i)) books.splice(i, 1); } selectedBooks.clear(); markDataChanged(); save(); renderBookListPage(); }); }; const selectAllCheck = document.createElement('input'); selectAllCheck.type = 'checkbox'; selectAllCheck.id = 'bookSelectAll'; selectAllCheck.onchange = () => { const books = getCurrentBooks(); if (selectAllCheck.checked) { books.forEach((b, i) => selectedBooks.add(i)); } else { selectedBooks.clear(); } renderBookList(document.getElementById('bookListContainer')); }; batchRow.appendChild(selectAllCheck); batchRow.appendChild(document.createTextNode('全选 ')); batchRow.appendChild(batchDeleteBtn); body.appendChild(batchRow); const listDiv = document.createElement('div'); listDiv.id = 'bookListContainer'; listDiv.style.cssText = 'flex:1;overflow-y:auto;'; renderBookList(listDiv); body.appendChild(listDiv); }

function renderBookList(container) { while (container.firstChild) container.removeChild(container.firstChild); const books = getCurrentBooks(); const kw = (document.getElementById('bookSearchInput')?.value || '').toLowerCase(); const filtered = kw ? books.filter(b => b.title.toLowerCase().includes(kw) || (b.author || '').toLowerCase().includes(kw)) : books; filtered.forEach((book, idx) => { const realIdx = books.indexOf(book); const item = document.createElement('div'); item.className = 'book-list-item'; item.style.cssText = 'display:flex;align-items:center;padding:10px;border-bottom:1px solid var(--border-light);'; const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selectedBooks.has(realIdx); checkbox.style.cssText = 'flex-shrink:0;margin-right:8px;'; checkbox.onchange = () => { if (checkbox.checked) selectedBooks.add(realIdx); else selectedBooks.delete(realIdx); }; item.appendChild(checkbox); const idxSpan = document.createElement('span'); idxSpan.className = 'item-index'; idxSpan.style.cssText = 'width:30px;text-align:center;font-size:12px;color:var(--text-secondary);flex-shrink:0;'; idxSpan.textContent = (realIdx + 1) + '.'; item.appendChild(idxSpan); const infoSpan = document.createElement('span'); infoSpan.className = 'item-info'; infoSpan.style.cssText = 'flex:1;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;user-select:none;-webkit-user-select:none;touch-action:manipulation;'; infoSpan.innerHTML = `${escapeHtml(book.title)} - ${escapeHtml(book.author)} ${book.status ? '(' + book.status + ')' : ''}`; let longPressTimer; infoSpan.addEventListener('touchstart', () => { longPressTimer = setTimeout(() => editBookItem(realIdx), 600); }); infoSpan.addEventListener('touchend', () => clearTimeout(longPressTimer)); infoSpan.addEventListener('touchmove', () => clearTimeout(longPressTimer)); item.appendChild(infoSpan); const actionsSpan = document.createElement('span'); actionsSpan.className = 'item-actions'; actionsSpan.style.cssText = 'position:relative;display:inline-flex;align-items:center;flex-shrink:0;margin-left:8px;'; const moreBtn = document.createElement('button'); moreBtn.className = 'btn'; moreBtn.style.cssText = 'font-size:16px;padding:2px 6px;display:inline-flex;align-items:center;vertical-align:middle;border:none;background:transparent;cursor:pointer;'; moreBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">${getIconSVG('more-vertical')}</svg>`; moreBtn.onclick = (e) => { e.stopPropagation(); const existingMenu = moreBtn.parentElement.querySelector('.book-actions-menu'); if (existingMenu) { existingMenu.remove(); return; } document.querySelectorAll('.book-actions-menu').forEach(m => m.remove()); const menu = document.createElement('div'); menu.className = 'book-actions-menu'; menu.style.cssText = 'position:absolute;right:0;top:100%;z-index:200;background:var(--secondary-bg);border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:4px;display:flex;flex-direction:column;min-width:90px;'; const moveItem = document.createElement('button'); moveItem.className = 'btn'; moveItem.style.cssText = 'font-size:12px;padding:6px 10px;display:flex;align-items:center;gap:4px;border:none;background:none;cursor:pointer;'; moveItem.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('move')}</svg> 移动`; moveItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); moveBookToList(realIdx); }; const shareItem = document.createElement('button'); shareItem.className = 'btn'; shareItem.style.cssText = 'font-size:12px;padding:6px 10px;display:flex;align-items:center;gap:4px;border:none;background:none;cursor:pointer;'; shareItem.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('share-2')}</svg> 分享`; shareItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); shareBookToContact(book); }; const deleteItem = document.createElement('button'); deleteItem.className = 'btn'; deleteItem.style.cssText = 'font-size:12px;padding:6px 10px;display:flex;align-items:center;gap:4px;border:none;background:none;cursor:pointer;color:#f44336;'; deleteItem.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('trash-2')}</svg> 删除`; deleteItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); deleteBook(realIdx); }; menu.appendChild(moveItem); menu.appendChild(shareItem); menu.appendChild(deleteItem); moreBtn.parentElement.appendChild(menu); const closeHandler = (ev) => { if (!menu.contains(ev.target) && ev.target !== moreBtn) { menu.remove(); document.removeEventListener('click', closeHandler); } }; setTimeout(() => document.addEventListener('click', closeHandler), 10); }; actionsSpan.appendChild(moreBtn); item.appendChild(actionsSpan); container.appendChild(item); }); if (filtered.length === 0) container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:20px">暂无书籍</div>'; }
function moveBookToList(fromIdx) { const books = getCurrentBooks(); const book = books[fromIdx]; const otherLists = appData.bookLists.filter((l, i) => i !== currentBookListIndex); if (otherLists.length === 0) { toast('没有其他书单'); return; } const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '移动到书单'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; otherLists.forEach(l => { const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;'; btn.textContent = l.name; btn.onclick = () => { l.books.push({ ...book }); books.splice(fromIdx, 1); markDataChanged(); save(); overlay.remove(); renderBookListPage(); toast('已移动'); }; body.appendChild(btn); }); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function editBookItem(idx) { const book = getCurrentBooks()[idx]; if (!book) return; const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '300px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '编辑书籍'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; body.innerHTML = `<input id="editBookTitle" value="${escapeHtml(book.title)}" placeholder="书名"><input id="editBookAuthor" value="${escapeHtml(book.author || '')}" placeholder="作者"><input id="editBookStatus" value="${escapeHtml(book.status || '')}" placeholder="状态">`; card.appendChild(body); const footer = document.createElement('div'); footer.className = 'pop-footer'; const saveBtn = document.createElement('button'); saveBtn.className = 'btn-primary'; saveBtn.textContent = '保存'; saveBtn.onclick = () => { book.title = document.getElementById('editBookTitle').value.trim() || book.title; book.author = document.getElementById('editBookAuthor').value.trim(); book.status = document.getElementById('editBookStatus').value.trim(); markDataChanged(); save(); overlay.remove(); renderBookListPage(); }; footer.appendChild(saveBtn); card.appendChild(footer); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function addBookItem() { const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '300px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '添加书籍'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; body.innerHTML = `<input id="bookTitle" placeholder="书名" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;"><input id="bookAuthor" placeholder="作者" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;"><input id="bookStatus" placeholder="状态（想读/在读/已读）" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;">`; card.appendChild(body); const footer = document.createElement('div'); footer.className = 'pop-footer'; const saveBtn = document.createElement('button'); saveBtn.className = 'btn-primary'; saveBtn.textContent = '保存'; saveBtn.onclick = () => { const title = document.getElementById('bookTitle').value.trim(); const author = document.getElementById('bookAuthor').value.trim(); const status = document.getElementById('bookStatus').value.trim(); if (!title) { toast('书名不能为空'); return; } const books = getCurrentBooks(); if (books.some(b => b.title === title && b.author === author)) { toast('此书已存在，已跳过'); overlay.remove(); return; } books.push({ title, author, status }); markDataChanged(); save(); overlay.remove(); renderBookListPage(); toast('书籍已添加'); }; footer.appendChild(saveBtn); card.appendChild(footer); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function pasteBookImport() { showInputDialogRaw('粘贴导入书籍', '每行格式：书名/作者/状态 或三行一组', (text) => { if (!text.trim()) { toast('未输入内容'); return; } const lines = text.split('\n').map(l => l.trim()).filter(Boolean); let added = 0; for (let i = 0; i < lines.length; i += 3) { const title = lines[i] || ''; const author = lines[i + 1] || ''; const status = lines[i + 2] || ''; if (title) { const books = getCurrentBooks(); if (!books.some(b => b.title === title && b.author === author)) { books.push({ title, author, status }); added++; } } } markDataChanged(); save(); toast(`导入 ${added} 本书`); renderBookListPage(); }); }
function deleteBook(idx) { showConfirm('删除这本书？', () => { getCurrentBooks().splice(idx, 1); markDataChanged(); save(); renderBookListPage(); }); }
function shareBookToContact(book) { const contacts = appData.users.filter(u => !u.members); if (!contacts.length) { toast('没有联系人'); return; } const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '分享给梦角'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; contacts.forEach(c => { const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;'; btn.textContent = c.name; btn.onclick = () => { addMessage(c.id, { text: `📖 ${appData.myProfile.name} 分享了一本书《${book.title}》${book.author ? '-' + book.author : ''}`, type: 'share', me: true, time: new Date().toISOString() }); overlay.remove(); toast('已分享'); }; body.appendChild(btn); }); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function exportBookList() { const books = getCurrentBooks(); const bl = getCurrentBookList(); const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '导出格式'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; const jsonBtn = document.createElement('button'); jsonBtn.className = 'btn-primary'; jsonBtn.textContent = '导出 JSON'; jsonBtn.onclick = () => { const blob = new Blob([JSON.stringify(books)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${bl.name}.json`; a.click(); URL.revokeObjectURL(a.href); overlay.remove(); }; const txtBtn = document.createElement('button'); txtBtn.className = 'btn-primary'; txtBtn.textContent = '导出 TXT'; txtBtn.onclick = () => { const txt = books.map(b => `${b.title}\n${b.author}\n${b.status}`).join('\n'); const blob = new Blob([txt], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${bl.name}.txt`; a.click(); URL.revokeObjectURL(a.href); overlay.remove(); }; body.appendChild(jsonBtn); body.appendChild(txtBtn); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
document.getElementById('bookFileInput').addEventListener('change', function(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(ev) { const content = ev.target.result; if (file.name.endsWith('.json')) { try { const arr = JSON.parse(content); if (Array.isArray(arr)) { arr.forEach(b => { if (b.title) { const books = getCurrentBooks(); if (!books.some(x => x.title === b.title && x.author === b.author)) books.push({ title: b.title, author: b.author || '', status: b.status || '' }); } }); markDataChanged(); save(); toast(`导入 ${arr.length} 本书`); } } catch { toast('JSON格式错误'); } } else { const lines = content.split('\n').map(l => l.trim()).filter(Boolean); for (let i = 0; i < lines.length; i += 3) { const title = lines[i] || ''; const author = lines[i + 1] || ''; const status = lines[i + 2] || ''; if (title) { const books = getCurrentBooks(); if (!books.some(x => x.title === title && x.author === author)) books.push({ title, author, status }); } } markDataChanged(); save(); toast('导入书籍完成'); } if (document.getElementById('bookListPage').classList.contains('active')) renderBookListPage(); }; reader.readAsText(file); e.target.value = ''; });

// ========== 电影列表 ==========
function getCurrentMovieList() { return appData.movieLists[currentMovieListIndex]; }
function getCurrentMovies() { const ml = getCurrentMovieList(); return ml ? ml.movies : []; }
function openMovieListPage() { hideAllPages(); document.getElementById('movieListPage').classList.add('active'); document.getElementById('movieListTitle').textContent = '电影列表'; renderMovieListPage(); }
function renderMovieListPage() { const body = document.getElementById('movieListPageContent'); while (body.firstChild) body.removeChild(body.firstChild); const ml = getCurrentMovieList(); const plRow = document.createElement('div'); plRow.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;'; const plSelect = document.createElement('select'); plSelect.id = 'moviePlSelect'; appData.movieLists.forEach((l, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = l.name + ' (' + l.movies.length + ')'; if (i === currentMovieListIndex) opt.selected = true; plSelect.appendChild(opt); }); plSelect.onchange = () => { currentMovieListIndex = parseInt(plSelect.value); renderMovieListPage(); }; plRow.appendChild(plSelect); const newPlBtn = document.createElement('button'); newPlBtn.className = 'btn'; newPlBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>电影列表'; newPlBtn.onclick = () => { showInputDialog('新建电影列表', '列表名', (name) => { if (name && !appData.movieLists.some(p => p.name === name)) { appData.movieLists.push({ name, movies: [] }); markDataChanged(); save(); renderMovieListPage(); } else { toast('列表名重复或为空'); } }); }; plRow.appendChild(newPlBtn); if (appData.movieLists.length > 1) { const delPlBtn = document.createElement('button'); delPlBtn.className = 'btn'; delPlBtn.textContent = '删除列表'; delPlBtn.onclick = () => { showConfirm('删除当前列表？', () => { if (appData.movieLists.length <= 1) { toast('至少保留一个列表'); return; } appData.movieLists.splice(currentMovieListIndex, 1); currentMovieListIndex = 0; markDataChanged(); save(); renderMovieListPage(); }); }; plRow.appendChild(delPlBtn); } body.appendChild(plRow); const searchRow = document.createElement('div'); searchRow.className = 'search-row'; const movieSearchInput = document.createElement('input'); movieSearchInput.id = 'movieSearchInput'; movieSearchInput.placeholder = '搜索电影名/导演...'; movieSearchInput.oninput = () => { renderMovieList(document.getElementById('movieListContainer')); }; searchRow.appendChild(movieSearchInput); body.appendChild(searchRow); const actionRow = document.createElement('div'); actionRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;'; const addBtn = document.createElement('button'); addBtn.className = 'btn'; addBtn.style.cssText = 'display:inline-flex;align-items:center;'; addBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>添加电影'; addBtn.onclick = addMovieItem; const importBtn = document.createElement('button'); importBtn.className = 'btn'; importBtn.style.cssText = 'display:inline-flex;align-items:center;'; importBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('download')}</svg>文件导入`; importBtn.onclick = () => document.getElementById('movieFileInput').click(); const pasteBtn = document.createElement('button'); pasteBtn.className = 'btn'; pasteBtn.style.cssText = 'display:inline-flex;align-items:center;'; pasteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('clipboard')}</svg>粘贴导入`; pasteBtn.onclick = pasteMovieImport; const exportBtn = document.createElement('button'); exportBtn.className = 'btn'; exportBtn.style.cssText = 'display:inline-flex;align-items:center;'; exportBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('upload')}</svg>导出`; exportBtn.onclick = exportMovieList; actionRow.appendChild(addBtn); actionRow.appendChild(importBtn); actionRow.appendChild(pasteBtn); actionRow.appendChild(exportBtn); body.appendChild(actionRow); const batchRow = document.createElement('div'); batchRow.style.cssText = 'display:flex;gap:6px;align-items:center;'; const batchDeleteBtn = document.createElement('button'); batchDeleteBtn.className = 'btn'; batchDeleteBtn.style.cssText = 'color:#f44336;display:inline-flex;align-items:center;'; batchDeleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="margin-right:4px;">${getIconSVG('trash-2')}</svg>批量删除选中`; batchDeleteBtn.onclick = () => { const movies = getCurrentMovies(); const selected = movies.filter((m, idx) => selectedMovies.has(idx)); if (selected.length === 0) { toast('请先选择电影'); return; } showConfirm(`删除选中的 ${selected.length} 部电影？`, () => { for (let i = movies.length - 1; i >= 0; i--) { if (selectedMovies.has(i)) movies.splice(i, 1); } selectedMovies.clear(); markDataChanged(); save(); renderMovieListPage(); }); }; const selectAllCheck = document.createElement('input'); selectAllCheck.type = 'checkbox'; selectAllCheck.id = 'movieSelectAll'; selectAllCheck.onchange = () => { const movies = getCurrentMovies(); if (selectAllCheck.checked) { movies.forEach((m, i) => selectedMovies.add(i)); } else { selectedMovies.clear(); } renderMovieList(document.getElementById('movieListContainer')); }; batchRow.appendChild(selectAllCheck); batchRow.appendChild(document.createTextNode('全选 ')); batchRow.appendChild(batchDeleteBtn); body.appendChild(batchRow); const listDiv = document.createElement('div'); listDiv.id = 'movieListContainer'; listDiv.style.cssText = 'flex:1;overflow-y:auto;'; renderMovieList(listDiv); body.appendChild(listDiv); }

function renderMovieList(container) { while (container.firstChild) container.removeChild(container.firstChild); const movies = getCurrentMovies(); const kw = (document.getElementById('movieSearchInput')?.value || '').toLowerCase(); const filtered = kw ? movies.filter(m => m.title.toLowerCase().includes(kw) || (m.director || '').toLowerCase().includes(kw)) : movies; filtered.forEach((movie, idx) => { const realIdx = movies.indexOf(movie); const item = document.createElement('div'); item.className = 'movie-list-item'; item.style.cssText = 'display:flex;align-items:center;padding:10px;border-bottom:1px solid var(--border-light);'; const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selectedMovies.has(realIdx); checkbox.style.cssText = 'flex-shrink:0;margin-right:8px;'; checkbox.onchange = () => { if (checkbox.checked) selectedMovies.add(realIdx); else selectedMovies.delete(realIdx); }; item.appendChild(checkbox); const idxSpan = document.createElement('span'); idxSpan.className = 'item-index'; idxSpan.style.cssText = 'width:30px;text-align:center;font-size:12px;color:var(--text-secondary);flex-shrink:0;'; idxSpan.textContent = (realIdx + 1) + '.'; item.appendChild(idxSpan); const infoSpan = document.createElement('span'); infoSpan.className = 'item-info'; infoSpan.style.cssText = 'flex:1;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;user-select:none;-webkit-user-select:none;touch-action:manipulation;'; infoSpan.innerHTML = `${escapeHtml(movie.title)} (${movie.year || ''}) ${movie.director ? '-' + movie.director : ''} ${movie.status ? '[' + movie.status + ']' : ''}`; let longPressTimer; infoSpan.addEventListener('touchstart', () => { longPressTimer = setTimeout(() => editMovieItem(realIdx), 600); }); infoSpan.addEventListener('touchend', () => clearTimeout(longPressTimer)); infoSpan.addEventListener('touchmove', () => clearTimeout(longPressTimer)); item.appendChild(infoSpan); const actionsSpan = document.createElement('span'); actionsSpan.className = 'item-actions'; actionsSpan.style.cssText = 'position:relative;display:inline-flex;align-items:center;flex-shrink:0;margin-left:8px;'; const moreBtn = document.createElement('button'); moreBtn.className = 'btn'; moreBtn.style.cssText = 'font-size:16px;padding:2px 6px;display:inline-flex;align-items:center;vertical-align:middle;border:none;background:transparent;cursor:pointer;'; moreBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">${getIconSVG('more-vertical')}</svg>`; moreBtn.onclick = (e) => { e.stopPropagation(); const existingMenu = moreBtn.parentElement.querySelector('.movie-actions-menu'); if (existingMenu) { existingMenu.remove(); return; } document.querySelectorAll('.movie-actions-menu').forEach(m => m.remove()); const menu = document.createElement('div'); menu.className = 'movie-actions-menu'; menu.style.cssText = 'position:absolute;right:0;top:100%;z-index:200;background:var(--secondary-bg);border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:4px;display:flex;flex-direction:column;min-width:90px;'; const moveItem = document.createElement('button'); moveItem.className = 'btn'; moveItem.style.cssText = 'font-size:12px;padding:6px 10px;display:flex;align-items:center;gap:4px;border:none;background:none;cursor:pointer;'; moveItem.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('move')}</svg> 移动`; moveItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); moveMovieToList(realIdx); }; const shareItem = document.createElement('button'); shareItem.className = 'btn'; shareItem.style.cssText = 'font-size:12px;padding:6px 10px;display:flex;align-items:center;gap:4px;border:none;background:none;cursor:pointer;'; shareItem.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('share-2')}</svg> 分享`; shareItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); shareMovieToContact(movie); }; const deleteItem = document.createElement('button'); deleteItem.className = 'btn'; deleteItem.style.cssText = 'font-size:12px;padding:6px 10px;display:flex;align-items:center;gap:4px;border:none;background:none;cursor:pointer;color:#f44336;'; deleteItem.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('trash-2')}</svg> 删除`; deleteItem.onclick = (e2) => { e2.stopPropagation(); menu.remove(); deleteMovie(realIdx); }; menu.appendChild(moveItem); menu.appendChild(shareItem); menu.appendChild(deleteItem); moreBtn.parentElement.appendChild(menu); const closeHandler = (ev) => { if (!menu.contains(ev.target) && ev.target !== moreBtn) { menu.remove(); document.removeEventListener('click', closeHandler); } }; setTimeout(() => document.addEventListener('click', closeHandler), 10); }; actionsSpan.appendChild(moreBtn); item.appendChild(actionsSpan); container.appendChild(item); }); if (filtered.length === 0) container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:20px">暂无电影</div>'; }
function moveMovieToList(fromIdx) { const movies = getCurrentMovies(); const movie = movies[fromIdx]; const otherLists = appData.movieLists.filter((l, i) => i !== currentMovieListIndex); if (otherLists.length === 0) { toast('没有其他列表'); return; } const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '移动到列表'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; otherLists.forEach(l => { const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;'; btn.textContent = l.name; btn.onclick = () => { l.movies.push({ ...movie }); movies.splice(fromIdx, 1); markDataChanged(); save(); overlay.remove(); renderMovieListPage(); toast('已移动'); }; body.appendChild(btn); }); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function editMovieItem(idx) { const movie = getCurrentMovies()[idx]; if (!movie) return; const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '300px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '编辑电影'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; body.innerHTML = `<input id="editMovieTitle" value="${escapeHtml(movie.title)}" placeholder="电影名"><input id="editMovieDirector" value="${escapeHtml(movie.director || '')}" placeholder="导演"><input id="editMovieYear" value="${escapeHtml(movie.year || '')}" placeholder="年份"><input id="editMovieStatus" value="${escapeHtml(movie.status || '')}" placeholder="状态">`; card.appendChild(body); const footer = document.createElement('div'); footer.className = 'pop-footer'; const saveBtn = document.createElement('button'); saveBtn.className = 'btn-primary'; saveBtn.textContent = '保存'; saveBtn.onclick = () => { movie.title = document.getElementById('editMovieTitle').value.trim() || movie.title; movie.director = document.getElementById('editMovieDirector').value.trim(); movie.year = document.getElementById('editMovieYear').value.trim(); movie.status = document.getElementById('editMovieStatus').value.trim(); markDataChanged(); save(); overlay.remove(); renderMovieListPage(); }; footer.appendChild(saveBtn); card.appendChild(footer); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function addMovieItem() { const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '300px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '添加电影'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; body.innerHTML = `<input id="movieTitle" placeholder="电影名" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;"><input id="movieDirector" placeholder="导演" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;"><input id="movieYear" placeholder="年份" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;"><input id="movieStatus" placeholder="状态（想看/已看）" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;">`; card.appendChild(body); const footer = document.createElement('div'); footer.className = 'pop-footer'; const saveBtn = document.createElement('button'); saveBtn.className = 'btn-primary'; saveBtn.textContent = '保存'; saveBtn.onclick = () => { const title = document.getElementById('movieTitle').value.trim(); const director = document.getElementById('movieDirector').value.trim(); const year = document.getElementById('movieYear').value.trim(); const status = document.getElementById('movieStatus').value.trim(); if (!title) { toast('电影名不能为空'); return; } const movies = getCurrentMovies(); if (movies.some(m => m.title === title && m.director === director && m.year === year)) { toast('此电影已存在，已跳过'); overlay.remove(); return; } movies.push({ title, director, year, status }); markDataChanged(); save(); overlay.remove(); renderMovieListPage(); toast('电影已添加'); }; footer.appendChild(saveBtn); card.appendChild(footer); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function pasteMovieImport() { showInputDialogRaw('粘贴导入电影', '每行格式：电影名/导演/年份/状态 或三行一组', (text) => { if (!text.trim()) { toast('未输入内容'); return; } const lines = text.split('\n').map(l => l.trim()).filter(Boolean); let added = 0; for (let i = 0; i < lines.length; i += 4) { const title = lines[i] || ''; const director = lines[i + 1] || ''; const year = lines[i + 2] || ''; const status = lines[i + 3] || ''; if (title) { const movies = getCurrentMovies(); if (!movies.some(m => m.title === title && m.director === director && m.year === year)) { movies.push({ title, director, year, status }); added++; } } } markDataChanged(); save(); toast(`导入 ${added} 部电影`); renderMovieListPage(); }); }
function deleteMovie(idx) { showConfirm('删除这部电影？', () => { getCurrentMovies().splice(idx, 1); markDataChanged(); save(); renderMovieListPage(); }); }
function shareMovieToContact(movie) { const contacts = appData.users.filter(u => !u.members); if (!contacts.length) { toast('没有联系人'); return; } const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '分享给梦角'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; contacts.forEach(c => { const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;'; btn.textContent = c.name; btn.onclick = () => { addMessage(c.id, { text: `🎬 ${appData.myProfile.name} 分享了一部电影《${movie.title}》${movie.year ? '(' + movie.year + ')' : ''}${movie.director ? ' - 导演 ' + movie.director : ''}`, type: 'share', me: true, time: new Date().toISOString() }); overlay.remove(); toast('已分享'); }; body.appendChild(btn); }); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function exportMovieList() { const movies = getCurrentMovies(); const ml = getCurrentMovieList(); const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '导出格式'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; const jsonBtn = document.createElement('button'); jsonBtn.className = 'btn-primary'; jsonBtn.textContent = '导出 JSON'; jsonBtn.onclick = () => { const blob = new Blob([JSON.stringify(movies)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${ml.name}.json`; a.click(); URL.revokeObjectURL(a.href); overlay.remove(); }; const txtBtn = document.createElement('button'); txtBtn.className = 'btn-primary'; txtBtn.textContent = '导出 TXT'; txtBtn.onclick = () => { const txt = movies.map(m => `${m.title}\n${m.director}\n${m.year}\n${m.status}`).join('\n'); const blob = new Blob([txt], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${ml.name}.txt`; a.click(); URL.revokeObjectURL(a.href); overlay.remove(); }; body.appendChild(jsonBtn); body.appendChild(txtBtn); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
document.getElementById('movieFileInput').addEventListener('change', function(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(ev) { const content = ev.target.result; if (file.name.endsWith('.json')) { try { const arr = JSON.parse(content); if (Array.isArray(arr)) { arr.forEach(m => { if (m.title) { const movies = getCurrentMovies(); if (!movies.some(x => x.title === m.title && x.director === m.director && x.year === m.year)) movies.push({ title: m.title, director: m.director || '', year: m.year || '', status: m.status || '' }); } }); markDataChanged(); save(); toast(`导入 ${arr.length} 部电影`); } } catch { toast('JSON格式错误'); } } else { const lines = content.split('\n').map(l => l.trim()).filter(Boolean); for (let i = 0; i < lines.length; i += 4) { const title = lines[i] || ''; const director = lines[i + 1] || ''; const year = lines[i + 2] || ''; const status = lines[i + 3] || ''; if (title) { const movies = getCurrentMovies(); if (!movies.some(x => x.title === title && x.director === director && x.year === year)) movies.push({ title, director, year, status }); } } markDataChanged(); save(); toast('导入电影完成'); } if (document.getElementById('movieListPage').classList.contains('active')) renderMovieListPage(); }; reader.readAsText(file); e.target.value = ''; });

// ========== 塔罗/雷诺曼 ==========
function openTarotPage() { hideAllPages(); document.getElementById('tarotPage').classList.add('active'); renderTarotPage(); }
function renderTarotPage() { const body = document.getElementById('tarotPageContent'); while (body.firstChild) body.removeChild(body.firstChild); body.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px;"><label>牌组：<select id="tarotDeck"><option value="tarot">塔罗</option><option value="lenormand">雷诺曼</option></select></label><label>问题：<input id="tarotQuestion" placeholder="输入你的问题..." style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border-light);"></label><label>梦角：<select id="tarotTarget">${appData.users.filter(u => !u.members).map(u => `<option value="${u.id}">${u.name}</option>`).join('')}</select></label><label>抽取张数：<input id="tarotCount" type="number" value="3" min="1" max="10" style="width:60px;"></label><button class="btn-primary" id="drawTarotBtn">抽取</button><div style="margin-top:10px;"><button class="btn" id="importTarotBtn">导入牌组</button> <button class="btn" id="addTarotCardBtn">添加单张牌</button></div><div id="tarotResult" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;"></div></div>`; document.getElementById('drawTarotBtn').onclick = () => { const deck = document.getElementById('tarotDeck').value; const question = document.getElementById('tarotQuestion').value.trim(); const targetId = document.getElementById('tarotTarget').value; const count = parseInt(document.getElementById('tarotCount').value) || 3; if (!question) { toast('请输入问题'); return; } const pool = appData.tarotCards[deck] || []; if (pool.length === 0) { toast('该牌组没有牌，请先导入或添加'); return; } const drawn = []; const usedIndices = new Set(); for (let i = 0; i < Math.min(count, pool.length); i++) { let idx; do { idx = Math.floor(Math.random() * pool.length); } while (usedIndices.has(idx)); usedIndices.add(idx); const card = pool[idx]; const reversed = deck === 'tarot' ? Math.random() < 0.5 : false; drawn.push({ ...card, reversed }); } const target = getContact(targetId); const resultDiv = document.getElementById('tarotResult'); resultDiv.innerHTML = ''; drawn.forEach(card => { const cardEl = document.createElement('div'); cardEl.className = 'tarot-card' + (card.reversed ? ' reversed' : ''); cardEl.innerHTML = `<b>${escapeHtml(card.name)}</b>${card.reversed ? '<br><small>逆位</small>' : ''}<br><small>${escapeHtml(card.meaning || '')}</small>`; resultDiv.appendChild(cardEl); }); if (target) { const cardNames = drawn.map(c => c.reversed ? `${c.name}(逆位)` : c.name).join('、'); addMessage(targetId, { text: `🔮 ${target.name} 为你抽取了${drawn.length}张牌：${cardNames}（问题：${question}）`, type: 'system', me: false, time: new Date().toISOString(), senderId: target.id, senderName: target.name }); } }; document.getElementById('importTarotBtn').onclick = () => { const fileInput = document.getElementById('restoreCardsInput'); fileInput._isTarotImport = true; fileInput.click(); fileInput.onchange = function(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(ev) { try { const arr = JSON.parse(ev.target.result); const deck = document.getElementById('tarotDeck').value; if (Array.isArray(arr)) { if (!appData.tarotCards[deck]) appData.tarotCards[deck] = []; arr.forEach(c => { if (c.name && c.meaning) appData.tarotCards[deck].push({ name: c.name, meaning: c.meaning }); }); markDataChanged(); save(); toast(`已导入 ${arr.length} 张牌`); } } catch { toast('JSON格式错误'); } }; reader.readAsText(file); e.target.value = ''; this._isTarotImport = false; }; }; document.getElementById('addTarotCardBtn').onclick = () => { showInputDialogRaw('添加单张牌', '格式：牌名|含义（逆位含义用/分隔）', (val) => { if (!val) return; const parts = val.split('|'); if (parts.length >= 2) { const deck = document.getElementById('tarotDeck').value; if (!appData.tarotCards[deck]) appData.tarotCards[deck] = []; appData.tarotCards[deck].push({ name: parts[0].trim(), meaning: parts[1].trim() }); markDataChanged(); save(); toast('牌已添加'); } else { toast('格式错误'); } }); }; document.getElementById('tarotBackBtn').onclick = () => { document.getElementById('tarotPage').classList.remove('active'); switchToDiscoverTab(); }; }

// ========== 语音库管理页面渲染 ==========
function openVoiceManagerPage(userId) { const u = getContact(userId); if (!u) return; document.getElementById('contactDetailPage').classList.remove('active'); document.getElementById('voiceManagerPage').classList.add('active'); document.getElementById('voiceManagerTitle').textContent = u.name + ' · 语音库'; renderVoiceManagerPage(userId); }
function renderVoiceManagerPage(userId) { const body = document.getElementById('voiceManagerPageContent'); while (body.firstChild) body.removeChild(body.firstChild); const voices = appData.userVoices[userId] || []; const infoDiv = document.createElement('div'); infoDiv.style.cssText = 'text-align:center;padding:8px 0;color:var(--text-secondary);font-size:13px;'; infoDiv.textContent = `共 ${voices.length} 条语音`; body.appendChild(infoDiv); const listDiv = document.createElement('div'); listDiv.style.cssText = 'flex:1;overflow-y:auto;'; if (voices.length === 0) { listDiv.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px;">暂无语音</div>'; } else { voices.forEach((voice, idx) => { const item = document.createElement('div'); item.style.cssText = 'display:flex;align-items:center;padding:10px;border-bottom:1px solid var(--border-light);gap:8px;'; const idxSpan = document.createElement('span'); idxSpan.style.cssText = 'width:24px;text-align:center;font-size:12px;color:var(--text-secondary);'; idxSpan.textContent = (idx + 1) + '.'; item.appendChild(idxSpan); const nameSpan = document.createElement('span'); nameSpan.style.cssText = 'flex:1;font-size:14px;'; nameSpan.textContent = voice.name || ('语音 ' + (idx + 1)); item.appendChild(nameSpan); const playBtn = document.createElement('button'); playBtn.className = 'btn'; playBtn.style.cssText = 'font-size:12px;padding:4px 10px;'; playBtn.textContent = '▶ 播放'; let audio = null; let isPlaying = false; playBtn.onclick = () => { if (isPlaying) { if (audio) { audio.pause(); audio = null; } playBtn.textContent = '▶ 播放'; isPlaying = false; } else { audio = new Audio(voice.data); audio.onended = () => { playBtn.textContent = '▶ 播放'; isPlaying = false; audio = null; }; audio.onerror = () => { const code = audio.error ? audio.error.code : 0; let msg = '播放失败，请重试'; if (code === 4) msg = '不支持该音频格式，请转换为 mp3'; else if (code === 3) msg = '音频解码失败，文件可能已损坏'; else if (code === 2) msg = '加载失败，请检查网络'; else msg = '播放出错（错误码 ' + code + '），可尝试用其他浏览器'; toast(msg); playBtn.textContent = '▶ 播放'; isPlaying = false; audio = null; }; audio.play().then(() => { playBtn.textContent = '⏸ 暂停'; isPlaying = true; }).catch(() => { toast('播放失败'); }); } }; item.appendChild(playBtn); const delBtn = document.createElement('button'); delBtn.className = 'btn'; delBtn.style.cssText = 'font-size:12px;padding:4px 10px;color:#f44336;'; delBtn.textContent = '🗑'; delBtn.onclick = () => { showConfirm('删除这条语音？', () => { appData.userVoices[userId].splice(idx, 1); markDataChanged(); save(); renderVoiceManagerPage(userId); toast('语音已删除'); }); }; item.appendChild(delBtn); listDiv.appendChild(item); }); } body.appendChild(listDiv); const addBtn = document.createElement('button'); addBtn.className = 'btn-primary'; addBtn.style.cssText = 'margin-top:8px;width:100%;'; addBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>添加语音'; addBtn.onclick = () => { importUserVoices(userId); }; body.appendChild(addBtn); document.getElementById('voiceManagerBackBtn').onclick = () => { document.getElementById('voiceManagerPage').classList.remove('active'); document.getElementById('contactDetailPage').classList.add('active'); renderContactDetail(userId); }; }

// ========== 一起看电影 ==========
function openMovieTogetherPage() { hideAllPages(); document.getElementById('movieTogetherPage').classList.add('active'); renderMovieTogetherPage(); }
function renderMovieTogetherPage() { const body = document.getElementById('movieTogetherPageContent'); while (body.firstChild) body.removeChild(body.firstChild); const activeMovieTask = appData.companionTasks.find(t => t.status === 'active' && t.type === 'movie'); if (activeMovieTask) { renderActiveMovieTask(body, activeMovieTask); } else { renderNewMovieTaskForm(body); } }
function renderNewMovieTaskForm(body) { body.innerHTML = `<div style="padding:20px;text-align:center;font-size:16px;">开始一起看电影</div><div style="display:flex;flex-direction:column;gap:10px;padding:0 20px;"><label>电影名：<input id="movieTogetherName" placeholder="输入电影名" style="width:100%;padding:8px;border-radius:12px;border:1px solid var(--border-light);"></label><label>梦角：<select id="movieTogetherTarget" style="width:100%;padding:8px;border-radius:12px;border:1px solid var(--border-light);">${appData.users.filter(u => !u.members).map(u => `<option value="${u.id}">${u.name}</option>`).join('')}</select></label><button class="btn-primary" id="startMovieTogetherBtn">开始</button></div>`; document.getElementById('startMovieTogetherBtn').onclick = () => { const name = document.getElementById('movieTogetherName').value.trim(); if (!name) { toast('请输入电影名'); return; } const targetId = document.getElementById('movieTogetherTarget').value; const task = { id: 'mt_' + Date.now(), type: 'movie', name, icon: '🍿', duration: 7200, startTime: new Date().toISOString(), endTime: new Date(Date.now() + 7200000).toISOString(), targetUserId: targetId, status: 'active', interactions: [] }; appData.companionTasks.push(task); currentCompanionTaskId = task.id; markDataChanged(); save(); addMessage(targetId, { text: `🍿 一起看电影《${name}》，开始啦！`, type: 'system', me: true, time: new Date().toISOString() }); startMovieTogetherTimers(task); renderMovieTogetherPage(); }; }
function renderActiveMovieTask(body, task) { const remainingSecs = Math.max(0, Math.floor((new Date(task.endTime).getTime() - Date.now()) / 1000)); const h = Math.floor(remainingSecs / 3600); const m = Math.floor((remainingSecs % 3600) / 60); const s = remainingSecs % 60; body.innerHTML = `<div style="text-align:center;padding:20px;"><div style="font-size:36px;">🍿</div><div style="font-size:20px;font-weight:bold;">${task.name}</div><div class="companion-timer" id="movieTogetherTimer">${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}</div></div><div class="companion-interactions" id="movieTogetherInteractions">${(task.interactions || []).slice().reverse().map(msg => `<div style="padding:6px;font-size:13px;"><b>${msg.sender}:</b> ${msg.text}</div>`).join('')}</div><div class="companion-controls"><button class="btn" id="movieEndBtn" style="color:#f44336;display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('stop-circle')}</svg>结束</button></div>`; document.getElementById('movieEndBtn').onclick = () => { endMovieTogetherTask(task); }; if (task.status === 'active') startMovieTogetherTimers(task); }
function startMovieTogetherTimers(task) { clearMovieTogetherTimers(); if (task.status !== 'active') return; movieTogetherTimerInterval = setInterval(() => { const remaining = Math.max(0, Math.floor((new Date(task.endTime).getTime() - Date.now()) / 1000)); const timerEl = document.getElementById('movieTogetherTimer'); if (timerEl) { const h = Math.floor(remaining / 3600); const m = Math.floor((remaining % 3600) / 60); const s = remaining % 60; timerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; } if (remaining <= 0) endMovieTogetherTask(task); }, 1000); movieTogetherInteractionInterval = setInterval(() => { if (task.status !== 'active') return; const target = getContact(task.targetUserId); if (!target) return; const comments = ['这段好精彩！', '你看到哪里了？', '这个反转绝了', '演技炸裂', '配乐好好听', '我都感动哭了', '这个镜头好美']; const text = comments[Math.floor(Math.random() * comments.length)]; task.interactions.push({ sender: target.name, text, time: new Date().toISOString() }); addMessage(task.targetUserId, { text: `🍿 ${target.name}: ${text}`, type: 'system', me: false, time: new Date().toISOString(), senderId: target.id, senderName: target.name }); const interactionsDiv = document.getElementById('movieTogetherInteractions'); if (interactionsDiv) { const div = document.createElement('div'); div.style.cssText = 'padding:6px;font-size:13px;'; div.innerHTML = `<b>${target.name}:</b> ${text}`; interactionsDiv.insertBefore(div, interactionsDiv.firstChild); } markDataChanged(); save(); }, 300000); }
function clearMovieTogetherTimers() { if (movieTogetherTimerInterval) { clearInterval(movieTogetherTimerInterval); movieTogetherTimerInterval = null; } if (movieTogetherInteractionInterval) { clearInterval(movieTogetherInteractionInterval); movieTogetherInteractionInterval = null; } }
function endMovieTogetherTask(task) { clearMovieTogetherTimers(); task.status = 'completed'; markDataChanged(); save(); renderMovieTogetherPage(); toast('电影结束啦！'); }
document.getElementById('movieTogetherBackBtn').onclick = () => { clearMovieTogetherTimers(); document.getElementById('movieTogetherPage').classList.remove('active'); switchToDiscoverTab(); };

// ========== 陪伴系统 ==========
function openCompanionPage() { hideAllPages(); document.getElementById('companionPage').classList.add('active'); document.getElementById('companionTitle').textContent = '陪伴系统'; renderCompanionPage(); }
function switchToCompanionActivePage(task) { hideAllPages(); const page = document.getElementById('companionActivePage'); page.classList.add('active'); document.getElementById('companionActiveTitle').textContent = task.name; renderCompanionActivePage(task); const header = page.querySelector('.full-page-header'); if (header) { header.style.display = appData.companionImmersiveMode ? 'none' : 'flex'; } window._lastCompanionTask = task; }
function renderCompanionActivePage(task) { const body = document.getElementById('companionActiveContent'); while (body.firstChild) body.removeChild(body.firstChild); const target = getContact(task.targetUserId); const companionBgs = (appData.companionBgs && appData.companionBgs[task.targetUserId]) || []; const bg = companionBgs.length > 0 ? companionBgs[0] : (target?.bg || ''); body.style.backgroundImage = bg ? `url(${bg})` : 'none'; body.style.backgroundSize = 'cover'; body.style.backgroundPosition = 'center'; body.style.backgroundColor = bg ? 'transparent' : '#d4c5b2'; const overlay = document.createElement('div'); overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.35);pointer-events:none;z-index:1;'; body.appendChild(overlay); const timerDiv = document.createElement('div'); timerDiv.id = 'companionActiveTimer'; timerDiv.style.cssText = 'position:absolute;left:12px;bottom:20px;background:rgba(180,150,120,0.55);color:rgba(255,248,240,0.95);padding:6px 14px;border-radius:20px;font-size:13px;font-weight:300;letter-spacing:0.5px;z-index:10;cursor:pointer;backdrop-filter:blur(4px);'; timerDiv.title = '点击隐藏/显示计时器'; let timerVisible = true; timerDiv.onclick = () => { timerVisible = !timerVisible; timerDiv.style.opacity = timerVisible ? '1' : '0.15'; }; body.appendChild(timerDiv); const controlBtn = document.createElement('div'); controlBtn.className = 'companion-control-dot'; controlBtn.style.cssText = 'position:absolute;right:16px;bottom:20px;z-index:10;width:42px;height:42px;background:rgba(180,150,120,0.5);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;color:rgba(255,248,240,0.9);cursor:pointer;backdrop-filter:blur(4px);'; controlBtn.textContent = '⚙'; controlBtn.onclick = () => { const oldPanel = document.querySelector('.companion-control-panel'); if (oldPanel) oldPanel.remove(); showCompanionControlPanel(task, body, target); }; body.appendChild(controlBtn); document.getElementById('companionActiveBackBtn').onclick = () => { if (appData.companionImmersiveMode) { toast('陪伴沉浸模式中，无法退出'); return; } stopCompanionSlideshow(); if (task.status === 'active') { task.status = 'paused'; task.pausedTime = new Date().toISOString(); clearCompanionTimers(); window._lastCompanionTask = task; markDataChanged(); save(); toast('陪伴已暂停'); } const timerInterval = window._companionTimerInterval; if (timerInterval) { clearInterval(timerInterval); window._companionTimerInterval = null; } document.getElementById('companionActivePage').classList.remove('active'); openCompanionPage(); }; const updateTimer = () => { if (task.status !== 'active' && task.status !== 'paused') return; let remaining; if (task.status === 'paused') { const pausedTime = task.pausedTime ? new Date(task.pausedTime).getTime() : Date.now(); const frozenElapsed = Math.floor((pausedTime - new Date(task.startTime).getTime()) / 1000); remaining = Math.max(0, task.duration - frozenElapsed); } else { const now = Date.now(); const elapsed = Math.floor((now - new Date(task.startTime).getTime()) / 1000); remaining = Math.max(0, task.duration - elapsed); } const hh = Math.floor(remaining / 3600); const mm = Math.floor((remaining % 3600) / 60); const ss = remaining % 60; timerDiv.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; if (remaining <= 0 && task.status === 'active') { stopCompanionSlideshow(); endCompanionTask(task, false); document.getElementById('companionActivePage').classList.remove('active'); openCompanionPage(); } }; updateTimer(); const timerInterval = setInterval(() => { if (!document.getElementById('companionActivePage').classList.contains('active')) { clearInterval(timerInterval); return; } updateTimer(); }, 1000); if (appData.companionBgSlideshow && companionBgs.length > 1) { startCompanionSlideshow(task, body); } }
function showCompanionControlPanel(task, parentBody, target) { const oldPanel = document.querySelector('.companion-control-panel'); if (oldPanel) oldPanel.remove(); const panel = document.createElement('div'); panel.className = 'companion-control-panel'; panel.style.cssText = 'position:absolute;bottom:80px;right:24px;z-index:20;background:rgba(30,30,30,0.85);backdrop-filter:blur(10px);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px;min-width:170px;max-height:60vh;overflow-y:auto;'; const infoDiv = document.createElement('div'); infoDiv.style.cssText = 'color:rgba(255,255,255,0.9);font-size:14px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:8px;margin-bottom:4px;'; infoDiv.textContent = `${target ? target.name : '梦角'} · 互动 ${task.interactions ? task.interactions.length : 0} 次`; panel.appendChild(infoDiv); const pauseBtn = document.createElement('button'); pauseBtn.style.cssText = 'padding:8px 14px;border-radius:20px;border:none;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.15);color:white;display:flex;align-items:center;justify-content:center;gap:6px;'; if (task.status === 'paused') { pauseBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('play-circle')}</svg>继续`; } else { pauseBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('pause-circle')}</svg>暂停`; } pauseBtn.onclick = () => { if (task.status === 'active') { task.status = 'paused'; task.pausedTime = new Date().toISOString(); clearCompanionTimers(); window._lastCompanionTask = task; pauseBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('play-circle')}</svg>继续`; toast('陪伴已暂停'); } else { const pausedDuration = task.pausedTime ? (Date.now() - new Date(task.pausedTime).getTime()) : 0; task.endTime = new Date(new Date(task.endTime).getTime() + pausedDuration).toISOString(); task.status = 'active'; task.pausedTime = null; startCompanionTimers(task); pauseBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('pause-circle')}</svg>暂停`; toast('陪伴继续'); } markDataChanged(); save(); const timerEl = document.getElementById('companionActiveTimer'); }; panel.appendChild(pauseBtn); const endBtn = document.createElement('button'); endBtn.style.cssText = 'padding:8px 14px;border-radius:20px;border:none;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.12);color:white;display:flex;align-items:center;justify-content:center;gap:6px;'; endBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('stop-circle')}</svg>结束`; endBtn.onclick = () => { panel.remove(); showConfirm('提前结束陪伴？', () => { stopCompanionSlideshow(); endCompanionTask(task, true); document.getElementById('companionActivePage').classList.remove('active'); openCompanionPage(); }); }; panel.appendChild(endBtn); const immersiveBtn = document.createElement('button'); immersiveBtn.style.cssText = 'padding:8px 14px;border-radius:20px;border:none;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.12);color:white;display:flex;align-items:center;justify-content:center;gap:6px;'; if (appData.companionImmersiveMode) { immersiveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('unlock')}</svg>沉浸:开`; } else { immersiveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('lock')}</svg>沉浸:关`; } immersiveBtn.onclick = () => { appData.companionImmersiveMode = !appData.companionImmersiveMode; markDataChanged(); save(); if (appData.companionImmersiveMode) { immersiveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('unlock')}</svg>沉浸:开`; } else { immersiveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('lock')}</svg>沉浸:关`; } const header = document.querySelector('#companionActivePage .full-page-header'); if (header) header.style.display = appData.companionImmersiveMode ? 'none' : 'flex'; toast(appData.companionImmersiveMode ? '沉浸模式已开启' : '沉浸模式已关闭'); }; panel.appendChild(immersiveBtn); const bgBtn = document.createElement('button'); bgBtn.style.cssText = 'padding:8px 14px;border-radius:20px;border:none;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.12);color:white;display:flex;align-items:center;justify-content:center;gap:6px;'; bgBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('image')}</svg>更换背景`; bgBtn.onclick = () => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = async function(e) { const f = e.target.files[0]; if (!f) return; try { const b64 = await processImage(f, 4096, 0.92); if (!appData.companionBgs) appData.companionBgs = {}; if (!appData.companionBgs[task.targetUserId]) appData.companionBgs[task.targetUserId] = []; if (!appData.companionBgs[task.targetUserId].includes(b64)) { appData.companionBgs[task.targetUserId].push(b64); } markDataChanged(); save(); parentBody.style.backgroundImage = `url(${b64})`; parentBody.style.backgroundColor = 'transparent'; toast('背景已添加'); if (appData.companionBgSlideshow && appData.companionBgs[task.targetUserId].length > 1) { stopCompanionSlideshow(); startCompanionSlideshow(task, parentBody); } } catch { toast('背景更换失败'); } }; input.click(); }; panel.appendChild(bgBtn); const manageBgBtn = document.createElement('button'); manageBgBtn.style.cssText = 'padding:8px 14px;border-radius:20px;border:none;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.12);color:white;display:flex;align-items:center;justify-content:center;gap:6px;'; manageBgBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('folder')}</svg>管理背景`; manageBgBtn.onclick = () => { panel.remove(); showCompanionBgGallery(task, parentBody); }; panel.appendChild(manageBgBtn); const slideshowBtn = document.createElement('button'); slideshowBtn.style.cssText = 'padding:8px 14px;border-radius:20px;border:none;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.12);color:white;display:flex;align-items:center;justify-content:center;gap:6px;'; if (appData.companionBgSlideshow) { slideshowBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('refresh-cw')}</svg>轮播:开`; } else { slideshowBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('refresh-cw')}</svg>轮播:关`; } slideshowBtn.onclick = () => { panel.remove(); showSlideshowSettingsPanel(task, parentBody); }; panel.appendChild(slideshowBtn); if (task.type === 'sleep') { const soundBtn = document.createElement('button'); soundBtn.style.cssText = 'padding:8px 14px;border-radius:20px;border:none;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.12);color:white;display:flex;align-items:center;justify-content:center;gap:6px;'; soundBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('music')}</svg>白噪音`; soundBtn.onclick = () => { panel.remove(); showSleepSoundPanel(task, parentBody); }; panel.appendChild(soundBtn); } const closeHandler = (e) => { if (!panel.contains(e.target) && e.target !== document.querySelector('.companion-control-dot')) { panel.remove(); document.removeEventListener('click', closeHandler); } }; setTimeout(() => document.addEventListener('click', closeHandler), 100); parentBody.appendChild(panel); }
function showCompanionBgGallery(task, parentBody) { const oldPanel = document.querySelector('.companion-control-panel'); if (oldPanel) oldPanel.remove(); if (!appData.companionBgs) appData.companionBgs = {}; if (!appData.companionBgs[task.targetUserId]) appData.companionBgs[task.targetUserId] = []; const bgs = appData.companionBgs[task.targetUserId]; const panel = document.createElement('div'); panel.className = 'companion-control-panel'; panel.style.cssText = 'position:absolute;bottom:80px;right:24px;z-index:20;background:rgba(30,30,30,0.85);backdrop-filter:blur(10px);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:8px;min-width:200px;max-height:50vh;overflow-y:auto;'; const title = document.createElement('div'); title.style.cssText = 'color:white;font-size:14px;font-weight:bold;text-align:center;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:8px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;gap:6px;'; title.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;vertical-align:middle;">${getIconSVG('image')}</svg><span style="line-height:1;">背景图库 (${bgs.length}张)</span>`; panel.appendChild(title); if (bgs.length === 0) { const emptyDiv = document.createElement('div'); emptyDiv.textContent = '暂无背景图'; emptyDiv.style.cssText = 'color:rgba(255,255,255,0.6);font-size:12px;text-align:center;padding:8px;'; panel.appendChild(emptyDiv); } else { bgs.forEach((bgUrl, idx) => { const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:8px;'; const thumb = document.createElement('img'); thumb.src = bgUrl; thumb.style.cssText = 'width:40px;height:40px;object-fit:cover;border-radius:6px;'; row.appendChild(thumb); const label = document.createElement('span'); label.textContent = `图${idx + 1}`; label.style.cssText = 'color:white;font-size:12px;flex:1;'; row.appendChild(label); const setBtn = document.createElement('button'); setBtn.style.cssText = 'padding:2px 6px;border-radius:10px;border:none;font-size:10px;cursor:pointer;background:rgba(255,255,255,0.15);color:white;display:flex;align-items:center;gap:3px;'; setBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('check')}</svg>`; setBtn.onclick = () => { parentBody.style.backgroundImage = `url(${bgUrl})`; parentBody.style.backgroundColor = 'transparent'; panel.remove(); toast('背景已切换'); }; row.appendChild(setBtn); const delBtn = document.createElement('button'); delBtn.style.cssText = 'padding:2px 6px;border-radius:10px;border:none;font-size:10px;cursor:pointer;background:rgba(244,67,54,0.5);color:white;display:flex;align-items:center;gap:3px;'; delBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('trash-2')}</svg>`; delBtn.onclick = () => { appData.companionBgs[task.targetUserId].splice(idx, 1); markDataChanged(); save(); if (appData.companionBgs[task.targetUserId].length === 0) { parentBody.style.backgroundImage = 'none'; parentBody.style.backgroundColor = '#d4c5b2'; } else if (parentBody.style.backgroundImage.includes(bgUrl)) { parentBody.style.backgroundImage = `url(${appData.companionBgs[task.targetUserId][0]})`; } stopCompanionSlideshow(); panel.remove(); showCompanionBgGallery(task, parentBody); }; row.appendChild(delBtn); panel.appendChild(row); }); } const addBtn = document.createElement('button'); addBtn.style.cssText = 'padding:6px 10px;border-radius:14px;border:none;font-size:12px;cursor:pointer;background:rgba(255,255,255,0.15);color:white;display:flex;align-items:center;justify-content:center;gap:6px;'; addBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('folder-plus')}</svg>批量添加背景`; addBtn.onclick = () => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.multiple = true; input.onchange = async function(e) { const files = Array.from(e.target.files); if (!files.length) return; let added = 0; for (const f of files) { try { const b64 = await processImage(f, 4096, 0.92); if (!appData.companionBgs[task.targetUserId].includes(b64)) { appData.companionBgs[task.targetUserId].push(b64); added++; } } catch (e) {} } if (added > 0) { markDataChanged(); save(); toast(`已添加 ${added} 张背景图`); panel.remove(); showCompanionBgGallery(task, parentBody); } else { toast('未添加新图片（可能重复或格式不支持）'); } }; input.click(); }; panel.appendChild(addBtn); const backBtn = document.createElement('button'); backBtn.style.cssText = 'padding:6px 10px;border-radius:14px;border:none;font-size:12px;cursor:pointer;background:rgba(255,255,255,0.1);color:white;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:6px;'; backBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('undo')}</svg>返回`; backBtn.onclick = () => { panel.remove(); showCompanionControlPanel(task, parentBody, getContact(task.targetUserId)); }; panel.appendChild(backBtn); const closeHandler = (e) => { if (!panel.contains(e.target) && e.target !== document.querySelector('.companion-control-dot')) { panel.remove(); document.removeEventListener('click', closeHandler); } }; setTimeout(() => document.addEventListener('click', closeHandler), 100); parentBody.appendChild(panel); }
function showSlideshowSettingsPanel(task, parentBody) { const oldPanel = document.querySelector('.companion-control-panel'); if (oldPanel) oldPanel.remove(); const panel = document.createElement('div'); panel.className = 'companion-control-panel'; panel.style.cssText = 'position:absolute;bottom:80px;right:24px;z-index:20;background:rgba(30,30,30,0.85);backdrop-filter:blur(10px);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px;min-width:200px;max-height:350px;overflow-y:auto;'; const title = document.createElement('div'); title.style.cssText = 'color:white;font-size:14px;font-weight:bold;text-align:center;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:8px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;gap:6px;'; title.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('refresh-cw')}</svg>背景轮播设置`; panel.appendChild(title); const toggleBtn = document.createElement('button'); toggleBtn.style.cssText = 'padding:8px 14px;border-radius:20px;border:none;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.15);color:white;display:flex;align-items:center;justify-content:center;gap:6px;'; if (appData.companionBgSlideshow) { toggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('pause-circle')}</svg>关闭轮播`; } else { toggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('play-circle')}</svg>开启轮播`; } toggleBtn.onclick = () => { appData.companionBgSlideshow = !appData.companionBgSlideshow; markDataChanged(); save(); if (appData.companionBgSlideshow) { toggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('pause-circle')}</svg>关闭轮播`; startCompanionSlideshow(task, parentBody); toast('轮播已开启'); } else { toggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('play-circle')}</svg>开启轮播`; stopCompanionSlideshow(); toast('轮播已关闭'); } }; panel.appendChild(toggleBtn); const intervalLabel = document.createElement('div'); intervalLabel.style.cssText = 'color:rgba(255,255,255,0.8);font-size:12px;text-align:center;margin-top:4px;'; intervalLabel.textContent = '轮播间隔时间'; panel.appendChild(intervalLabel); const intervalRow = document.createElement('div'); intervalRow.style.cssText = 'display:flex;gap:6px;align-items:center;justify-content:center;'; const totalSecs = appData.companionBgSlideshowInterval || 30; const currentH = Math.floor(totalSecs / 3600); const currentM = Math.floor((totalSecs % 3600) / 60); const currentS = totalSecs % 60; const hInput = document.createElement('input'); hInput.type = 'number'; hInput.value = currentH; hInput.min = 0; hInput.max = 23; hInput.style.cssText = 'width:40px;padding:4px;border-radius:8px;border:none;text-align:center;font-size:12px;'; const hLabel = document.createElement('span'); hLabel.textContent = '时'; hLabel.style.cssText = 'color:white;font-size:11px;'; const mInput = document.createElement('input'); mInput.type = 'number'; mInput.value = currentM; mInput.min = 0; mInput.max = 59; mInput.style.cssText = 'width:40px;padding:4px;border-radius:8px;border:none;text-align:center;font-size:12px;'; const mLabel = document.createElement('span'); mLabel.textContent = '分'; mLabel.style.cssText = 'color:white;font-size:11px;'; const sInput = document.createElement('input'); sInput.type = 'number'; sInput.value = currentS; sInput.min = 0; sInput.max = 59; sInput.style.cssText = 'width:40px;padding:4px;border-radius:8px;border:none;text-align:center;font-size:12px;'; const sLabel = document.createElement('span'); sLabel.textContent = '秒'; sLabel.style.cssText = 'color:white;font-size:11px;'; intervalRow.appendChild(hInput); intervalRow.appendChild(hLabel); intervalRow.appendChild(mInput); intervalRow.appendChild(mLabel); intervalRow.appendChild(sInput); intervalRow.appendChild(sLabel); panel.appendChild(intervalRow); const saveIntervalBtn = document.createElement('button'); saveIntervalBtn.style.cssText = 'padding:6px 10px;border-radius:14px;border:none;font-size:12px;cursor:pointer;background:rgba(197,164,126,0.6);color:white;display:flex;align-items:center;justify-content:center;gap:6px;'; saveIntervalBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('save')}</svg>保存间隔`; saveIntervalBtn.onclick = () => { const h = parseInt(hInput.value) || 0; const m = parseInt(mInput.value) || 0; const s = parseInt(sInput.value) || 0; const total = h * 3600 + m * 60 + s; if (total < 1) { toast('间隔不能小于1秒'); return; } appData.companionBgSlideshowInterval = total; markDataChanged(); save(); toast(`轮播间隔已设为 ${h}时${m}分${s}秒`); if (appData.companionBgSlideshow) { stopCompanionSlideshow(); startCompanionSlideshow(task, parentBody); } }; panel.appendChild(saveIntervalBtn); const backBtn = document.createElement('button'); backBtn.style.cssText = 'padding:6px 10px;border-radius:14px;border:none;font-size:12px;cursor:pointer;background:rgba(255,255,255,0.1);color:white;display:flex;align-items:center;justify-content:center;gap:6px;'; backBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('undo')}</svg>返回`; backBtn.onclick = () => { panel.remove(); showCompanionControlPanel(task, parentBody, getContact(task.targetUserId)); }; panel.appendChild(backBtn); const closeHandler = (e) => { if (!panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', closeHandler); } }; setTimeout(() => document.addEventListener('click', closeHandler), 100); parentBody.appendChild(panel); }
function startCompanionSlideshow(task, parentBody) { stopCompanionSlideshow(); const bgs = (appData.companionBgs && appData.companionBgs[task.targetUserId]) || []; if (bgs.length <= 1) return; let currentIndex = 0; const intervalMs = (appData.companionBgSlideshowInterval || 30) * 1000; companionSlideshowTimer = setInterval(() => { currentIndex = (currentIndex + 1) % bgs.length; parentBody.style.backgroundImage = `url(${bgs[currentIndex]})`; parentBody.style.backgroundSize = 'cover'; parentBody.style.backgroundPosition = 'center'; parentBody.style.backgroundColor = 'transparent'; }, intervalMs); }
function stopCompanionSlideshow() { if (companionSlideshowTimer) { clearInterval(companionSlideshowTimer); companionSlideshowTimer = null; } }
function showSleepSoundPanel(task, parentBody) { const oldPanel = document.querySelector('.companion-control-panel'); if (oldPanel) oldPanel.remove(); const panel = document.createElement('div'); panel.className = 'companion-control-panel'; panel.style.cssText = 'position:absolute;bottom:80px;right:24px;z-index:20;background:rgba(30,30,30,0.85);backdrop-filter:blur(10px);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px;min-width:180px;max-height:300px;overflow-y:auto;'; const title = document.createElement('div'); title.textContent = '白噪音'; title.style.cssText = 'color:white;font-size:14px;font-weight:bold;text-align:center;'; panel.appendChild(title); const stopBtn = document.createElement('button'); stopBtn.textContent = '⏹️ 停止'; stopBtn.style.cssText = 'padding:6px 10px;border-radius:14px;border:none;font-size:12px;cursor:pointer;background:rgba(255,255,255,0.15);color:white;'; stopBtn.onclick = () => { if (window._sleepAudio) { window._sleepAudio.pause(); window._sleepAudio = null; } toast('白噪音已停止'); }; panel.appendChild(stopBtn); (appData.sleepSounds || []).forEach((sound, idx) => { const btn = document.createElement('button'); btn.textContent = sound.name; btn.style.cssText = 'padding:6px 10px;border-radius:14px;border:none;font-size:12px;cursor:pointer;background:rgba(255,255,255,0.1);color:white;'; btn.onclick = () => { if (window._sleepAudio) { window._sleepAudio.pause(); window._sleepAudio = null; } window._sleepAudio = new Audio(sound.data); window._sleepAudio.loop = true; window._sleepAudio.play().catch(() => toast('播放失败')); panel.querySelectorAll('button').forEach(b => b.style.background = 'rgba(255,255,255,0.1)'); btn.style.background = 'rgba(197,164,126,0.5)'; }; panel.appendChild(btn); }); const addBtn = document.createElement('button'); addBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>添加白噪音'; addBtn.style.cssText = 'padding:6px 10px;border-radius:14px;border:1px dashed rgba(255,255,255,0.3);font-size:12px;cursor:pointer;background:transparent;color:white;'; addBtn.onclick = () => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'audio/*'; input.multiple = true; input.onchange = function(e) { const files = Array.from(e.target.files); if (!files.length) return; let count = 0; files.forEach(f => { const reader = new FileReader(); reader.onload = function(ev) { if (!appData.sleepSounds) appData.sleepSounds = []; appData.sleepSounds.push({ name: f.name || '白噪音', data: ev.target.result }); count++; if (count === files.length) { markDataChanged(); save(); panel.remove(); showSleepSoundPanel(task, parentBody); } }; reader.readAsDataURL(f); }); }; input.click(); }; panel.appendChild(addBtn); const closeHandler = (e) => { if (!panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', closeHandler); } }; setTimeout(() => document.addEventListener('click', closeHandler), 100); parentBody.appendChild(panel); }
function renderCompanionPage() { const body = document.getElementById('companionPageContent'); while (body.firstChild) body.removeChild(body.firstChild); const activeTask = appData.companionTasks.find(t => (t.status === 'active' || t.status === 'paused') && t.type !== 'movie'); if (activeTask) { currentCompanionTaskId = activeTask.id; renderActiveTask(body, activeTask); } else { renderNewTaskForm(body); renderCompanionHistory(body); } }
function renderNewTaskForm(body) { const formDiv = document.createElement('div'); formDiv.innerHTML = `<div style="padding:10px;text-align:center;font-size:16px;">新建陪伴项目</div><div style="display:flex;flex-direction:column;gap:10px;padding:0 20px;"><label>类型：<select id="compType"><option value="study">📚 学习</option><option value="work">💼 工作</option><option value="read">📖 看书</option><option value="sport">🏃 运动</option><option value="sleep">😴 睡眠</option><option value="custom">🎯 自定义</option></select></label><label>项目名：<input id="compName" placeholder="项目名称" style="width:100%;padding:8px;border-radius:12px;border:1px solid var(--border-light);"></label><label>时长：<input id="compH" type="number" value="0" min="0" style="width:60px;"> 时 <input id="compM" type="number" value="30" min="0" style="width:60px;"> 分 <input id="compS" type="number" value="0" min="0" style="width:60px;"> 秒</label><label>互动间隔：<input id="compIntervalH" type="number" value="0" min="0" style="width:60px;"> 时 <input id="compIntervalM" type="number" value="5" min="0" style="width:60px;"> 分 <input id="compIntervalS" type="number" value="0" min="0" style="width:60px;"> 秒</label><label>梦角：<select id="compTarget">${appData.users.filter(u => !u.members).map(u => `<option value="${u.id}">${u.name}</option>`).join('')}</select></label><button class="btn-primary" id="startCompanionBtn">开始陪伴</button></div>`; body.appendChild(formDiv); document.getElementById('startCompanionBtn').onclick = () => { const type = document.getElementById('compType').value; const name = document.getElementById('compName').value.trim() || document.getElementById('compType').selectedOptions[0].text.split(' ')[1]; const h = parseInt(document.getElementById('compH').value) || 0; const m = parseInt(document.getElementById('compM').value) || 0; const s = parseInt(document.getElementById('compS').value) || 0; const totalSecs = h * 3600 + m * 60 + s; if (totalSecs <= 0) { toast('请设置时长'); return; } const intervalH = parseInt(document.getElementById('compIntervalH').value) || 0; const intervalM = parseInt(document.getElementById('compIntervalM').value) || 0; const intervalS = parseInt(document.getElementById('compIntervalS').value) || 0; const intervalSecs = intervalH * 3600 + intervalM * 60 + intervalS; const targetUserId = document.getElementById('compTarget').value; const task = { id: 'ct_' + Date.now(), type, name, icon: type === 'study' ? '📚' : type === 'work' ? '💼' : type === 'read' ? '📖' : type === 'sport' ? '🏃' : type === 'sleep' ? '😴' : '🎯', duration: totalSecs, intervalSecs: intervalSecs > 0 ? intervalSecs : 300, startTime: new Date().toISOString(), endTime: new Date(Date.now() + totalSecs * 1000).toISOString(), targetUserId, status: 'active', interactions: [] }; appData.companionTasks.push(task); currentCompanionTaskId = task.id; markDataChanged(); save(); startCompanionTimers(task); document.getElementById('companionPage').classList.remove('active'); switchToCompanionActivePage(task); }; }
function renderActiveTask(body, task) { const remainingSecs = Math.max(0, Math.floor((new Date(task.endTime).getTime() - Date.now()) / 1000)); const h = Math.floor(remainingSecs / 3600); const m = Math.floor((remainingSecs % 3600) / 60); const s = remainingSecs % 60; const target = getContact(task.targetUserId); const taskDiv = document.createElement('div'); const pauseIcon = task.status === 'paused' ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;">${getIconSVG('play-circle')}</svg>` : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;">${getIconSVG('pause-circle')}</svg>`; const pauseText = task.status === 'paused' ? '继续' : '暂停'; const enterIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;">${getIconSVG('play-circle')}</svg>`; const endIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="vertical-align:middle;margin-right:4px;">${getIconSVG('stop-circle')}</svg>`; taskDiv.innerHTML = `<div style="text-align:center;padding:20px;"><div style="font-size:36px;">${task.icon}</div><div style="font-size:20px;font-weight:bold;">${task.name}</div><div class="companion-timer" id="companionTimer">${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}</div><div class="companion-info">和 ${target ? target.name : '梦角'} 一起</div></div><div class="companion-interactions" id="companionInteractions">${(task.interactions || []).slice().reverse().map(msg => `<div style="padding:6px;font-size:13px;"><b>${msg.sender}:</b> ${msg.text}</div>`).join('')}</div><div class="companion-controls"><button class="btn" id="compPauseBtn" style="display:flex;align-items:center;">${pauseIcon}${pauseText}</button><button class="btn" id="compEnterBtn" style="display:flex;align-items:center;">${enterIcon}进入陪伴</button><button class="btn" id="compEndBtn" style="color:#f44336;display:flex;align-items:center;">${endIcon}提前结束</button></div>`; body.appendChild(taskDiv); clearCompanionTimers(); document.getElementById('compPauseBtn').onclick = () => { if (task.status === 'active') { task.status = 'paused'; task.pausedTime = new Date().toISOString(); clearCompanionTimers(); toast('陪伴已暂停'); } else { const pausedDuration = task.pausedTime ? (Date.now() - new Date(task.pausedTime).getTime()) : 0; task.endTime = new Date(new Date(task.endTime).getTime() + pausedDuration).toISOString(); task.status = 'active'; task.pausedTime = null; startCompanionTimers(task); toast('陪伴继续'); } markDataChanged(); save(); renderCompanionPage(); }; document.getElementById('compEnterBtn').onclick = () => { switchToCompanionActivePage(task); }; document.getElementById('compEndBtn').onclick = () => { showConfirm('提前结束陪伴？', () => { endCompanionTask(task, true); }); }; }
function renderCompanionHistory(body) { const historyDiv = document.createElement('div'); historyDiv.style.cssText = 'margin-top:16px;'; historyDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:8px;">历史记录</div>'; const completed = appData.companionTasks.filter(t => t.status === 'completed' || t.status === 'cancelled'); if (completed.length === 0) { historyDiv.innerHTML += '<div style="color:var(--text-secondary);text-align:center;">暂无记录</div>'; } else { completed.slice().reverse().forEach(t => { const div = document.createElement('div'); div.style.cssText = 'padding:8px;border-bottom:1px solid var(--border-light);font-size:13px;'; div.innerHTML = `${t.icon} ${t.name} · ${new Date(t.startTime).toLocaleString()} · ${t.status === 'completed' ? '已完成' : '已取消'} · 互动${t.interactions.length}次 · 时长${fmtCompanionDuration(t.duration)}`; historyDiv.appendChild(div); }); const calDiv = document.createElement('div'); calDiv.style.marginTop = '8px'; calDiv.innerHTML = '<div style="font-weight:bold;">日历</div>'; const calContainer = document.createElement('div'); calContainer.className = 'date-calendar'; const now = new Date(); const renderCal = (y, m) => { calContainer.innerHTML = ''; const calHeader = document.createElement('div'); calHeader.className = 'cal-header'; const prevBtn = document.createElement('button'); prevBtn.textContent = '‹'; prevBtn.onclick = () => { const newM = m - 1; renderCal(newM < 1 ? y - 1 : y, newM < 1 ? 12 : newM); }; const nextBtn = document.createElement('button'); nextBtn.textContent = '›'; nextBtn.onclick = () => { const newM = m + 1; renderCal(newM > 12 ? y + 1 : y, newM > 12 ? 1 : newM); }; const monthLabel = document.createElement('span'); monthLabel.className = 'cal-month'; monthLabel.textContent = `${y}年${m}月`; calHeader.appendChild(prevBtn); calHeader.appendChild(monthLabel); calHeader.appendChild(nextBtn); calContainer.appendChild(calHeader); const table = document.createElement('table'); table.className = 'cal-table'; const thead = document.createElement('thead'); const trH = document.createElement('tr'); ['日', '一', '二', '三', '四', '五', '六'].forEach(d => { const th = document.createElement('th'); th.textContent = d; trH.appendChild(th); }); thead.appendChild(trH); table.appendChild(thead); const tbody = document.createElement('tbody'); const compDates = new Set(completed.map(t => new Date(t.startTime).toDateString())); const firstDay = new Date(y, m - 1, 1).getDay(); const daysInMonth = new Date(y, m, 0).getDate(); let date = 1, nextMonthDate = 1; const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7; for (let i = 0; i < totalCells; i++) { if (i % 7 === 0) { var row = document.createElement('tr'); tbody.appendChild(row); } const td = document.createElement('td'); if (i < firstDay) { td.textContent = ''; td.className = 'other-month'; } else if (date <= daysInMonth) { td.textContent = date; const dateObj = new Date(y, m - 1, date); if (compDates.has(dateObj.toDateString())) { td.classList.add('has-chat'); } else { td.classList.add('no-chat'); } if (dateObj.toDateString() === now.toDateString()) td.classList.add('today'); date++; } else { td.textContent = nextMonthDate; td.className = 'other-month'; nextMonthDate++; } row.appendChild(td); } table.appendChild(tbody); calContainer.appendChild(table); }; renderCal(now.getFullYear(), now.getMonth() + 1); historyDiv.appendChild(calContainer); } body.appendChild(historyDiv); }
function startCompanionTimers(task) { clearCompanionTimers(); if (task.status !== 'active') return; companionTimerInterval = setInterval(() => { const remaining = Math.max(0, Math.floor((new Date(task.endTime).getTime() - Date.now()) / 1000)); const timerEl = document.getElementById('companionTimer'); if (timerEl) { const h = Math.floor(remaining / 3600); const m = Math.floor((remaining % 3600) / 60); const s = remaining % 60; timerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; } if (remaining <= 0) { endCompanionTask(task, false); } }, 1000); const intervalMs = (task.intervalSecs || 300) * 1000; companionInteractionInterval = setInterval(() => { if (task.status !== 'active') return; const target = getContact(task.targetUserId); if (!target) return; const typeMessages = { study: ['加油！还有一会儿就完成了', '我也在看资料', '休息一下眼睛吧', '这段内容好难啊'], work: ['辛苦了', '还有多久下班', '一起加油', '专注力max'], read: ['这本书好看吗', '我看到第X章了', '这句话写得真好', '继续看，我也在'], sport: ['继续坚持！', '燃烧卡路里', '做完这组休息', '流汗的感觉真好'], sleep: ['晚安～', '好梦', '快睡吧，我也睡了', '明天见'], custom: ['一起加油', '坚持就是胜利', '快完成啦', '好棒'] }; const msgs = typeMessages[task.type] || typeMessages.custom; const text = msgs[Math.floor(Math.random() * msgs.length)]; task.interactions.push({ sender: target.name, text, time: new Date().toISOString() }); addMessage(task.targetUserId, { text: `💬 ${target.name}: ${text}`, type: 'system', me: false, time: new Date().toISOString(), senderId: target.id, senderName: target.name }); const interactionsDiv = document.getElementById('companionInteractions'); if (interactionsDiv) { const div = document.createElement('div'); div.style.cssText = 'padding:6px;font-size:13px;'; div.innerHTML = `<b>${target.name}:</b> ${text}`; interactionsDiv.insertBefore(div, interactionsDiv.firstChild); } markDataChanged(); save(); }, intervalMs); }
function clearCompanionTimers() { if (companionTimerInterval) { clearInterval(companionTimerInterval); companionTimerInterval = null; } if (companionInteractionInterval) { clearInterval(companionInteractionInterval); companionInteractionInterval = null; } const timerEl = document.getElementById('companionTimer'); if (timerEl && window._lastCompanionTask) { const task = window._lastCompanionTask; if (task.status === 'paused') { const pausedTime = task.pausedTime ? new Date(task.pausedTime).getTime() : Date.now(); const frozenElapsed = Math.floor((pausedTime - new Date(task.startTime).getTime()) / 1000); const remaining = Math.max(0, task.duration - frozenElapsed); const hh = Math.floor(remaining / 3600); const mm = Math.floor((remaining % 3600) / 60); const ss = remaining % 60; timerEl.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; } } }
function endCompanionTask(task, cancelled) { clearCompanionTimers(); task.status = cancelled ? 'cancelled' : 'completed'; const actualDuration = Math.floor((Date.now() - new Date(task.startTime).getTime()) / 1000); task.duration = Math.min(actualDuration, task.duration); const target = getContact(task.targetUserId); if (!cancelled && target) { const summary = `🎯 陪伴结束：${task.name} 持续${fmtCompanionDuration(task.duration)}，互动${task.interactions.length}次`; addMessage(task.targetUserId, { text: summary, type: 'system', me: false, time: new Date().toISOString() }); } markDataChanged(); save(); renderCompanionPage(); toast(cancelled ? '陪伴已提前结束' : `⏰ 陪伴时间到！`); }
function fmtCompanionDuration(totalSecs) { const h = Math.floor(totalSecs / 3600); const m = Math.floor((totalSecs % 3600) / 60); const s = totalSecs % 60; return `${h}时${m}分${s}秒`; }

// ========== 主题设置页面 ==========
function openThemePage() { document.getElementById('mePage').classList.remove('active'); document.getElementById('themePage').classList.add('active'); renderThemePage(); }
function renderThemePage() { const body = document.getElementById('themePageContent'); body.innerHTML = ''; const preview = document.createElement('div'); preview.style.cssText = `height:80px;margin:12px;border-radius:16px;background:${appData.themeColor || '#c5a47e'};display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:bold;text-shadow:0 1px 3px rgba(0,0,0,0.3);`; preview.textContent = '当前主题色预览'; body.appendChild(preview); const presetTitle = document.createElement('div'); presetTitle.style.cssText = 'padding:8px 12px;font-size:14px;font-weight:bold;color:var(--text-secondary);'; presetTitle.textContent = '系统预设'; body.appendChild(presetTitle); const presetRow = document.createElement('div'); presetRow.style.cssText = 'display:flex;gap:12px;padding:8px 12px;flex-wrap:wrap;'; const presets = ['#c5a47e', '#7e9cc5', '#c58ea4', '#8ec5a4', '#a48ec5', '#d4b896', '#b8c5a4', '#c5a4b8']; presets.forEach(color => { const dot = document.createElement('div'); const isActive = (color === appData.themeColor); dot.style.cssText = `width:48px;height:48px;border-radius:50%;background:${color};cursor:pointer;border:3px solid ${isActive ? '#333' : 'transparent'};transition:border 0.2s;`; dot.onclick = () => { applyTheme(color); renderThemePage(); }; presetRow.appendChild(dot); }); body.appendChild(presetRow); const customTitle = document.createElement('div'); customTitle.style.cssText = 'padding:8px 12px;font-size:14px;font-weight:bold;color:var(--text-secondary);margin-top:8px;'; customTitle.textContent = '自定义颜色'; body.appendChild(customTitle); const customRow = document.createElement('div'); customRow.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 12px;'; const colorInput = document.createElement('input'); colorInput.type = 'color'; colorInput.value = appData.themeColor || '#c5a47e'; colorInput.style.cssText = 'width:48px;height:48px;border:none;cursor:pointer;border-radius:50%;'; colorInput.oninput = () => { applyTheme(colorInput.value); renderThemePage(); }; customRow.appendChild(colorInput); const colorLabel = document.createElement('span'); colorLabel.textContent = '点击取色，实时预览'; colorLabel.style.cssText = 'font-size:13px;color:var(--text-secondary);'; customRow.appendChild(colorLabel); body.appendChild(customRow); document.getElementById('themeBackBtn').onclick = () => { document.getElementById('themePage').classList.remove('active'); document.getElementById('mePage').classList.add('active'); renderMePage(); }; }
// ---------- 五子棋游戏 ----------
let gomokuGame = null;
let gomokuCustomMessages = JSON.parse(localStorage.getItem('jxj_gomoku_msgs') || '["该你了", "快点呀", "下这里", "你好厉害", "再来一局"]');

function openGomokuPage(userId) {
  hideAllPages();
  document.getElementById('gomokuPage').classList.add('active');
  // 每次都创建新游戏，让玩家重新选择难度和颜色
  gomokuGame = new GomokuGame('gomokuPageContent', userId);
}

class GomokuGame {
    constructor(containerId, userId) {
        this.container = document.getElementById(containerId);
        this.userId = userId;
        this.size = 9;
        this.cellSize = 0;
        this.padding = 20;
        this.board = [];
        this.currentPlayer = 'me';
        this.gameOver = false;
        this.meColor = 'black';
        this.mjColor = 'white';
        this.moveHistory = [];
        this.timer = null;
        this.lastMoveTime = 0;
        this.forcedMove = false;
        this.difficulty = 'medium'; // 默认中等难度
        this.thinkTime = 0;         // 当前思考已用时间
        this.maxThinkTime = 60;     // 最大思考时间（秒）
        this.graceTime = 10;        // 前10秒不计时
        this.countdownTimer = null; // 倒计时刷新
        this.initUI();
    }

    initUI() {
        this.container.innerHTML = '';
        
        const contact = getContact(this.userId);
        
        // 顶部信息栏（MJ）
        const topBar = document.createElement('div');
        topBar.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 12px;width:100%;max-width:400px;margin:0 auto;';
        
        const mjAvatar = document.createElement('div');
        mjAvatar.className = 'gomoku-avatar';
        mjAvatar.style.cssText = 'width:40px;height:40px;border-radius:50%;overflow:hidden;cursor:pointer;flex-shrink:0;';
        if(contact && contact.avt){
            mjAvatar.innerHTML = `<img src="${contact.avt}" style="width:100%;height:100%;object-fit:cover;">`;
        } else {
            mjAvatar.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21c0-4.5 3-7 6.5-7s6.5 2.5 6.5 7"/></svg>`;
        }
        mjAvatar.title = '点击发送快捷消息';
        mjAvatar.onclick = () => this.showQuickMsg('mj');
        topBar.appendChild(mjAvatar);
        
        this.mjStoneIndicator = document.createElement('span');
        this.mjStoneIndicator.style.cssText = 'width:20px;height:20px;border-radius:50%;flex-shrink:0;';
        topBar.appendChild(this.mjStoneIndicator);
        
        const mjName = document.createElement('span');
        mjName.style.cssText = 'font-weight:bold;color:var(--text-primary);font-size:14px;';
        mjName.textContent = contact ? contact.name : '梦角';
        topBar.appendChild(mjName);
        
        this.mjColorText = document.createElement('span');
        this.mjColorText.style.cssText = 'font-size:12px;color:var(--text-secondary);';
        topBar.appendChild(this.mjColorText);
        
        // 倒计时显示（放在 MJ 信息栏右侧）
        this.timerDisplay = document.createElement('span');
        this.timerDisplay.style.cssText = 'margin-left:auto;font-size:20px;font-weight:bold;color:var(--theme);min-width:50px;text-align:right;';
        this.timerDisplay.textContent = '';
        topBar.appendChild(this.timerDisplay);
        
        this.container.appendChild(topBar);
        
        // 棋盘区域
        const boardContainer = document.createElement('div');
        boardContainer.style.cssText = 'position:relative;display:flex;justify-content:center;width:100%;max-width:400px;margin:0 auto;';
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'gomokuCanvas';
        this.canvas.style.cssText = 'width:100%;max-width:360px;display:block;';
        boardContainer.appendChild(this.canvas);
        this.container.appendChild(boardContainer);
        
        // 底部信息栏（我）
        const bottomBar = document.createElement('div');
        bottomBar.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:8px 12px;width:100%;max-width:400px;margin:0 auto;';
        
        this.meColorText = document.createElement('span');
        this.meColorText.style.cssText = 'font-size:12px;color:var(--text-secondary);';
        bottomBar.appendChild(this.meColorText);
        
        const meName = document.createElement('span');
        meName.style.cssText = 'font-weight:bold;color:var(--text-primary);font-size:14px;';
        meName.textContent = appData.myProfile.name;
        bottomBar.appendChild(meName);
        
        this.meStoneIndicator = document.createElement('span');
        this.meStoneIndicator.style.cssText = 'width:20px;height:20px;border-radius:50%;flex-shrink:0;';
        bottomBar.appendChild(this.meStoneIndicator);
        
        const meAvatar = document.createElement('div');
        meAvatar.className = 'gomoku-avatar';
        meAvatar.style.cssText = 'width:40px;height:40px;border-radius:50%;overflow:hidden;cursor:pointer;flex-shrink:0;';
        if(appData.myProfile.avt){
            meAvatar.innerHTML = `<img src="${appData.myProfile.avt}" style="width:100%;height:100%;object-fit:cover;">`;
        } else {
            meAvatar.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21c0-4.5 3-7 6.5-7s6.5 2.5 6.5 7"/></svg>`;
        }
        meAvatar.title = '点击发送快捷消息';
        meAvatar.onclick = () => this.showQuickMsg('me');
        bottomBar.appendChild(meAvatar);
        
        this.container.appendChild(bottomBar);
        
        // 状态和按钮
        this.statusDiv = document.createElement('div');
        this.statusDiv.className = 'gomoku-status';
        this.statusDiv.textContent = '请选择难度';
        this.container.appendChild(this.statusDiv);
        
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px;';
        
        this.undoBtn = document.createElement('button');
        this.undoBtn.className = 'gomoku-btn';
        this.undoBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('undo')}</svg> 悔棋`;
        this.undoBtn.onclick = () => this.requestUndo();
        btnRow.appendChild(this.undoBtn);
        
        this.urgeBtn = document.createElement('button');
        this.urgeBtn.className = 'gomoku-btn';
        this.urgeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('bell')}</svg> 催促`;
        this.urgeBtn.onclick = () => this.urgeOpponent();
        btnRow.appendChild(this.urgeBtn);
        
        this.msgBtn = document.createElement('button');
        this.msgBtn.className = 'gomoku-btn';
        this.msgBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('edit-3')}</svg> 消息`;
        this.msgBtn.onclick = () => this.manageMessages();
        btnRow.appendChild(this.msgBtn);
        
        this.resetBtn = document.createElement('button');
        this.resetBtn.className = 'gomoku-btn';
        this.resetBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('refresh-cw')}</svg> 重来`;
        this.resetBtn.onclick = () => this.reset();
        btnRow.appendChild(this.resetBtn);
        
        this.container.appendChild(btnRow);
        
        this.bubbleLayer = document.createElement('div');
        this.bubbleLayer.style.cssText = 'position:relative;width:100%;max-width:400px;margin:8px auto;min-height:30px;';
        this.container.appendChild(this.bubbleLayer);
        
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.boundResize = () => this.adjustCanvasSize();
        window.addEventListener('resize', this.boundResize);
        
        this.resetBoard();
        
        setTimeout(() => {
            this.adjustCanvasSize();
            this.showDifficultySelect();
        }, 100);
    }

    // 难度选择弹窗
    showDifficultySelect() {
        const overlay = document.createElement('div');
        overlay.className = 'mask show';
        const card = document.createElement('div');
        card.className = 'pop-card';
        card.style.width = '280px';
        const header = document.createElement('div');
        header.className = 'pop-header';
        header.textContent = '选择难度';
        card.appendChild(header);
        const body = document.createElement('div');
        body.className = 'pop-body';
        body.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
        
        const modes = [
            { label: '简单', value: 'easy', desc: '梦角随机落子，适合放松' },
            { label: '中等', value: 'medium', desc: '梦角会防守，有一定挑战' },
            { label: '困难', value: 'hard', desc: '梦角主动进攻，很难赢' }
        ];
        
        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.cssText = 'width:100%;text-align:left;padding:10px;';
            btn.innerHTML = `<b>${mode.label}</b><br><span style="font-size:11px;color:var(--text-secondary);">${mode.desc}</span>`;
            btn.onclick = () => {
                overlay.remove();
                this.difficulty = mode.value;
                this.showColorSelect();
            };
            body.appendChild(btn);
        });
        
        card.appendChild(body);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
    }

    updateStoneIndicators() {
        if (this.meColor === 'black') {
            this.meStoneIndicator.style.background = '#333';
            this.meStoneIndicator.style.border = 'none';
        } else {
            this.meStoneIndicator.style.background = '#fff';
            this.meStoneIndicator.style.border = '2px solid #333';
        }
        this.meColorText.textContent = this.meColor === 'black' ? '黑棋' : '白棋';
        
        if (this.mjColor === 'black') {
            this.mjStoneIndicator.style.background = '#333';
            this.mjStoneIndicator.style.border = 'none';
        } else {
            this.mjStoneIndicator.style.background = '#fff';
            this.mjStoneIndicator.style.border = '2px solid #333';
        }
        this.mjColorText.textContent = this.mjColor === 'black' ? '黑棋' : '白棋';
    }

    showColorSelect() {
        const overlay = document.createElement('div');
        overlay.className = 'mask show';
        const card = document.createElement('div');
        card.className = 'pop-card';
        card.style.width = '280px';
        const header = document.createElement('div');
        header.className = 'pop-header';
        header.textContent = '选择棋子颜色';
        card.appendChild(header);
        const body = document.createElement('div');
        body.className = 'pop-body';
        body.style.cssText = 'display:flex;gap:10px;justify-content:center;';
        const blackBtn = document.createElement('button');
        blackBtn.className = 'btn-primary';
        blackBtn.textContent = '黑棋（先手）';
        blackBtn.onclick = () => {
            overlay.remove();
            this.meColor = 'black';
            this.mjColor = 'white';
            this.currentPlayer = 'me';
            this.updateStoneIndicators();
            this.adjustCanvasSize();
            this.startGame();
        };
        const whiteBtn = document.createElement('button');
        whiteBtn.className = 'btn';
        whiteBtn.textContent = '白棋（后手）';
        whiteBtn.onclick = () => {
            overlay.remove();
            this.meColor = 'white';
            this.mjColor = 'black';
            this.currentPlayer = 'mj';
            this.updateStoneIndicators();
            this.adjustCanvasSize();
            this.startGame();
        };
        body.appendChild(blackBtn);
        body.appendChild(whiteBtn);
        card.appendChild(body);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
    }

    startGame() {
        const diffLabels = { easy: '简单', medium: '中等', hard: '困难' };
        this.statusDiv.textContent = `${diffLabels[this.difficulty]} · ` + (this.currentPlayer === 'me' ? '轮到你落子了' : '梦角思考中...');
        this.lastMoveTime = Date.now();
        this.thinkTime = 0;
        this.updateTimerDisplay();
        this.startTimer();
        if (this.currentPlayer === 'mj') {
            setTimeout(() => this.mjMove(), this.getMJDelay());
        }
    }

    // 根据难度获取梦角思考延迟（秒）
    getMJDelay() {
        const min = this.difficulty === 'easy' ? 1 : (this.difficulty === 'medium' ? 2 : 3);
        const max = this.difficulty === 'easy' ? 3 : (this.difficulty === 'medium' ? 5 : 10);
        return (min + Math.random() * (max - min)) * 1000;
    }

    // 获取最大思考时间
    getMaxThinkTime() {
        return this.difficulty === 'easy' ? 45 : (this.difficulty === 'medium' ? 60 : 90);
    }

    startTimer() {
        clearInterval(this.timer);
        clearInterval(this.countdownTimer);
        this.lastMoveTime = Date.now();
        this.thinkTime = 0;
        this.forcedMove = false;
        this.maxThinkTime = this.getMaxThinkTime();
        this.updateTimerDisplay();
        
        this.countdownTimer = setInterval(() => {
            this.thinkTime = Math.floor((Date.now() - this.lastMoveTime) / 1000);
            this.updateTimerDisplay();
            
            // 超过10秒开始显示倒计时
            if (this.thinkTime > this.graceTime && this.thinkTime <= this.maxThinkTime) {
                const remaining = this.maxThinkTime - this.thinkTime;
                this.timerDisplay.textContent = `${remaining}s`;
                if (remaining <= 10) {
                    this.timerDisplay.style.color = '#f44336';
                } else {
                    this.timerDisplay.style.color = 'var(--theme)';
                }
            } else if (this.thinkTime <= this.graceTime) {
                this.timerDisplay.textContent = '';
            }
            
            // MJ 自动催促
            if (this.thinkTime > 30 && !this.forcedMove && this.currentPlayer === 'me') {
                if (Math.random() < 0.4) {
                    const msg = gomokuCustomMessages[Math.floor(Math.random() * gomokuCustomMessages.length)];
                    this.showBubble('mj', msg);
                }
            }
            
            // 超过最大时间，强制落子
            if (this.thinkTime >= this.maxThinkTime) {
                this.forcedMove = true;
                this.timerDisplay.textContent = '超时!';
                if (this.currentPlayer === 'me') {
                    this.randomMove('me');
                } else {
                    this.randomMove('mj');
                }
            }
        }, 500);
    }

    updateTimerDisplay() {
        if (this.thinkTime <= this.graceTime) {
            this.timerDisplay.textContent = '';
        }
    }

    randomMove(player) {
        if (this.gameOver) return;
        const empty = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.board[r][c]) empty.push({row: r, col: c});
            }
        }
        if (empty.length > 0) {
            const move = empty[Math.floor(Math.random() * empty.length)];
            this.placeStone(move.row, move.col, player);
        }
    }

    placeStone(row, col, player) {
        this.board[row][col] = player;
        this.moveHistory.push({row, col, player});
        this.drawBoard();
        clearInterval(this.timer);
        clearInterval(this.countdownTimer);
        this.timerDisplay.textContent = '';
        this.forcedMove = false;
        if (this.checkWin(row, col, player)) {
            this.gameOver = true;
            const diffLabels = { easy: '简单', medium: '中等', hard: '困难' };
            this.statusDiv.textContent = `${diffLabels[this.difficulty]} · ` + (player === 'me' ? '🎉 你赢了！' : '梦角赢了');
            return;
        }
        if (this.isBoardFull()) {
            this.gameOver = true;
            this.statusDiv.textContent = '平局';
            return;
        }
        this.switchPlayer();
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'me' ? 'mj' : 'me';
        const diffLabels = { easy: '简单', medium: '中等', hard: '困难' };
        if (this.currentPlayer === 'me') {
            this.statusDiv.textContent = `${diffLabels[this.difficulty]} · 轮到你落子了`;
            this.startTimer();
        } else {
            this.statusDiv.textContent = `${diffLabels[this.difficulty]} · 梦角思考中...`;
            this.startTimer();
            setTimeout(() => this.mjMove(), this.getMJDelay());
        }
    }

    handleClick(e) {
        if (this.gameOver || this.currentPlayer !== 'me') return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return;
        if (this.board[row][col] !== null) return;
        this.placeStone(row, col, 'me');
    }

    mjMove() {
        if (this.gameOver) return;
        let move;
        if (this.difficulty === 'easy') {
            move = this.getEasyMove();
        } else if (this.difficulty === 'medium') {
            move = this.getMediumMove();
        } else {
            move = this.getHardMove();
        }
        if (move) {
            this.placeStone(move.row, move.col, 'mj');
        } else {
            this.randomMove('mj');
        }
    }

    // 简单：随机落子
    getEasyMove() {
        const empty = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.board[r][c]) empty.push({row: r, col: c});
            }
        }
        if (empty.length === 0) return null;
        return empty[Math.floor(Math.random() * empty.length)];
    }

    // 中等：只防守，不主动进攻
    getMediumMove() {
        // 先检查自己能否连五
        const winMove = this.findWinningMove('mj');
        if (winMove) return winMove;
        // 检查是否需要堵对方
        const blockMove = this.findWinningMove('me');
        if (blockMove) return blockMove;
        // 堵对方的三连或四连
        const threatMove = this.findThreatMove('me');
        if (threatMove) return threatMove;
        // 否则随机走
        return this.getEasyMove();
    }

    // 困难：主动进攻 + 防守
    getHardMove() {
        return this.getAIMove();
    }

    // 查找威胁（三连或四连）
    findThreatMove(player) {
        const size = this.size;
        const directions = [[0,1],[1,0],[1,1],[1,-1]];
        let bestMove = null;
        let bestScore = 0;
        
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (this.board[r][c] !== null) continue;
                
                let score = 0;
                for (const [dx, dy] of directions) {
                    let count = 1;
                    for (let step = 1; step < 5; step++) {
                        const nr = r + step * dx, nc = c + step * dy;
                        if (nr >= 0 && nr < size && nc >= 0 && nc < size && this.board[nr][nc] === player) count++;
                        else break;
                    }
                    for (let step = 1; step < 5; step++) {
                        const nr = r - step * dx, nc = c - step * dy;
                        if (nr >= 0 && nr < size && nc >= 0 && nc < size && this.board[nr][nc] === player) count++;
                        else break;
                    }
                    if (count >= 3) score += count * count;
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {row: r, col: c};
                }
            }
        }
        return bestMove;
    }

    getAIMove() {
        const size = this.size;
        const directions = [[0,1],[1,0],[1,1],[1,-1]];
        
        const countDirection = (row, col, dx, dy, player) => {
            let count = 0;
            for (let step = 1; step < 5; step++) {
                const r = row + step * dx, c = col + step * dy;
                if (r >= 0 && r < size && c >= 0 && c < size && this.board[r][c] === player) count++;
                else break;
            }
            for (let step = 1; step < 5; step++) {
                const r = row - step * dx, c = col - step * dy;
                if (r >= 0 && r < size && c >= 0 && c < size && this.board[r][c] === player) count++;
                else break;
            }
            return count;
        };
        
        const scoreMove = (row, col) => {
            let score = 0;
            for (const [dx, dy] of directions) {
                const mjCount = countDirection(row, col, dx, dy, 'mj');
                const meCount = countDirection(row, col, dx, dy, 'me');
                
                if (mjCount >= 4) score += 10000;
                else if (mjCount === 3) score += 800;
                else if (mjCount === 2) score += 50;
                else if (mjCount === 1) score += 5;
                
                if (meCount >= 4) score += 20000;
                else if (meCount === 3) score += 5000;
                else if (meCount === 2) score += 300;
                else if (meCount === 1) score += 20;
            }
            const centerDist = Math.abs(row - 4) + Math.abs(col - 4);
            score += (8 - centerDist) * 2;
            score += Math.random() * 30;
            return score;
        };
        
        const candidates = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (this.board[r][c] === null) {
                    candidates.push({ row: r, col: c, score: scoreMove(r, c) });
                }
            }
        }
        
        if (candidates.length === 0) return null;
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0];
    }

    findWinningMove(player) {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === null) {
                    this.board[r][c] = player;
                    if (this.checkWin(r, c, player)) {
                        this.board[r][c] = null;
                        return {row: r, col: c};
                    }
                    this.board[r][c] = null;
                }
            }
        }
        return null;
    }

    requestUndo() {
        if (this.gameOver) return;
        if (this.currentPlayer !== 'me') {
            toast('现在不是你悔棋的时候');
            return;
        }
        if (this.moveHistory.length < 1) {
            toast('无棋可悔');
            return;
        }
        const agree = Math.random() < 0.5;
        if (agree) {
            for (let i = 0; i < 2; i++) {
                if (this.moveHistory.length > 0) {
                    const last = this.moveHistory.pop();
                    this.board[last.row][last.col] = null;
                }
            }
            this.drawBoard();
            this.currentPlayer = 'me';
            const diffLabels = { easy: '简单', medium: '中等', hard: '困难' };
            this.statusDiv.textContent = `${diffLabels[this.difficulty]} · 梦角同意悔棋，轮到你落子了`;
            this.startTimer();
            toast('梦角同意悔棋');
        } else {
            toast('梦角不同意悔棋');
            this.showBubble('mj', '我不想悔棋');
        }
    }

    urgeOpponent() {
        if (this.gameOver) return;
        if (this.currentPlayer !== 'mj') {
            toast('现在是你自己的回合');
            return;
        }
        const msg = gomokuCustomMessages[Math.floor(Math.random() * gomokuCustomMessages.length)];
        this.showBubble('me', msg);
        toast('已催促');
    }

    showQuickMsg(who) {
        const msgs = gomokuCustomMessages;
        const overlay = document.createElement('div');
        overlay.className = 'mask show';
        const card = document.createElement('div');
        card.className = 'pop-card';
        card.style.width = '250px';
        const header = document.createElement('div');
        header.className = 'pop-header';
        header.textContent = '快捷消息';
        card.appendChild(header);
        const body = document.createElement('div');
        body.className = 'pop-body';
        body.style.maxHeight = '200px';
        body.style.overflowY = 'auto';
        msgs.forEach(msg => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.cssText = 'width:100%;text-align:left;margin-bottom:4px;';
            btn.textContent = msg;
            btn.onclick = () => {
                overlay.remove();
                this.showBubble(who, msg);
            };
            body.appendChild(btn);
        });
        card.appendChild(body);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
    }

    showBubble(who, msg) {
        const bubble = document.createElement('div');
        bubble.style.cssText = `max-width:70%;padding:6px 10px;border-radius:12px;font-size:13px;margin:4px 0;word-break:break-word;animation: fadeInOut 3s forwards;`;
        if (who === 'me') {
            bubble.style.cssText += 'margin-left:auto;background:var(--bubble-sent);color:#fff;border-top-right-radius:2px;';
        } else {
            bubble.style.cssText += 'margin-right:auto;background:var(--bubble-recv);border:1px solid var(--bubble-recv-border);border-top-left-radius:2px;';
        }
        bubble.textContent = msg;
        this.bubbleLayer.appendChild(bubble);
        setTimeout(() => { if(bubble.parentNode) bubble.remove(); }, 3000);
    }

    manageMessages() {
        const overlay = document.createElement('div');
        overlay.className = 'mask show';
        const card = document.createElement('div');
        card.className = 'pop-card';
        card.style.width = '300px';
        const header = document.createElement('div');
        header.className = 'pop-header';
        header.textContent = '管理快捷消息';
        card.appendChild(header);
        const body = document.createElement('div');
        body.className = 'pop-body';
        body.style.maxHeight = '300px';
        body.style.overflowY = 'auto';
        
        const inputRow = document.createElement('div');
        inputRow.style.cssText = 'display:flex;gap:6px;margin-bottom:8px;';
        const input = document.createElement('input');
        input.placeholder = '添加新消息';
        input.style.cssText = 'flex:1;padding:4px 8px;border-radius:8px;border:1px solid var(--border-light);';
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-primary';
        addBtn.textContent = '添加';
        addBtn.onclick = () => {
            const val = input.value.trim();
            if (val && !gomokuCustomMessages.includes(val)) {
                gomokuCustomMessages.push(val);
                localStorage.setItem('jxj_gomoku_msgs', JSON.stringify(gomokuCustomMessages));
                overlay.remove();
                this.manageMessages();
            }
        };
        inputRow.appendChild(input);
        inputRow.appendChild(addBtn);
        body.appendChild(inputRow);
        
        gomokuCustomMessages.forEach((msg, idx) => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border-light);';
            row.textContent = msg;
            const delBtn = document.createElement('button');
            delBtn.className = 'btn';
            delBtn.style.cssText = 'color:#f44336;font-size:12px;';
            delBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('trash-2')}</svg>`;
            delBtn.onclick = () => {
                gomokuCustomMessages.splice(idx, 1);
                localStorage.setItem('jxj_gomoku_msgs', JSON.stringify(gomokuCustomMessages));
                overlay.remove();
                this.manageMessages();
            };
            row.appendChild(delBtn);
            body.appendChild(row);
        });
        card.appendChild(body);
        const footer = document.createElement('div');
        footer.className = 'pop-footer';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn';
        closeBtn.textContent = '关闭';
        closeBtn.onclick = () => overlay.remove();
        footer.appendChild(closeBtn);
        card.appendChild(footer);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
    }

    adjustCanvasSize() {
        const containerWidth = this.container.clientWidth - 32;
        const maxWidth = 360;
        const width = Math.min(containerWidth, maxWidth);
        if (width <= 0) return;
        this.canvas.width = width;
        this.canvas.height = width;
        this.cellSize = (width - this.padding * 2) / (this.size - 1);
        this.drawBoard();
    }

    resetBoard() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.moveHistory = [];
        this.gameOver = false;
        clearInterval(this.timer);
        clearInterval(this.countdownTimer);
        this.timerDisplay.textContent = '';
        this.drawBoard();
    }

    reset() {
        this.resetBoard();
        setTimeout(() => {
            this.adjustCanvasSize();
            this.showDifficultySelect();
        }, 100);
    }

    drawBoard() {
        const ctx = this.canvas.getContext('2d');
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-bg').trim() || '#f5f3f0';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-light').trim() || '#e9eef3';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.size; i++) {
            const pos = this.padding + i * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(this.padding, pos);
            ctx.lineTo(w - this.padding, pos);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos, this.padding);
            ctx.lineTo(pos, h - this.padding);
            ctx.stroke();
        }
        const starPoints = [[4,4], [2,2], [2,6], [6,2], [6,6]];
        const dotRadius = this.cellSize * 0.08;
        ctx.fillStyle = '#6c7a89';
        starPoints.forEach(([r, c]) => {
            const x = this.padding + c * this.cellSize;
            const y = this.padding + r * this.cellSize;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        });
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c]) {
                    const x = this.padding + c * this.cellSize;
                    const y = this.padding + r * this.cellSize;
                    const radius = this.cellSize * 0.4;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    if (this.board[r][c] === 'me') {
                        if (this.meColor === 'black') {
                            ctx.fillStyle = '#333';
                            ctx.fill();
                        } else {
                            ctx.fillStyle = '#fff';
                            ctx.fill();
                            ctx.strokeStyle = '#333';
                            ctx.lineWidth = 2;
                            ctx.stroke();
                        }
                    } else {
                        if (this.mjColor === 'black') {
                            ctx.fillStyle = '#333';
                            ctx.fill();
                        } else {
                            ctx.fillStyle = '#fff';
                            ctx.fill();
                            ctx.strokeStyle = '#333';
                            ctx.lineWidth = 2;
                            ctx.stroke();
                        }
                    }
                }
            }
        }
    }

    checkWin(row, col, player) {
        const directions = [[0,1],[1,0],[1,1],[1,-1]];
        for (const [dx, dy] of directions) {
            let count = 1;
            for (let step = 1; step < 5; step++) {
                const r = row + step * dx;
                const c = col + step * dy;
                if (r >= 0 && r < this.size && c >= 0 && c < this.size && this.board[r][c] === player) count++;
                else break;
            }
            for (let step = 1; step < 5; step++) {
                const r = row - step * dx;
                const c = col - step * dy;
                if (r >= 0 && r < this.size && c >= 0 && c < this.size && this.board[r][c] === player) count++;
                else break;
            }
            if (count >= 5) return true;
        }
        return false;
    }

    isBoardFull() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === null) return false;
            }
        }
        return true;
    }
}