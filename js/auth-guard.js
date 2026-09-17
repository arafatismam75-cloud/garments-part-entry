// Session Guard - all protected pages use this
let currentUser = null;
let userProfile = null;

(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = session.user;

  // Load or create profile
  let { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (!profile) {
    const name = currentUser.user_metadata?.full_name || currentUser.email;
    const { data: newProfile } = await supabaseClient
      .from('profiles')
      .insert({ id: currentUser.id, full_name: name, email: currentUser.email })
      .select()
      .single();
    profile = newProfile;
  }
  userProfile = profile;

  // Update UI
  const nameEl = document.getElementById('userEmail');
  if (nameEl) nameEl.textContent = userProfile?.full_name || currentUser.email;

  const avatarEl = document.getElementById('userAvatar');
  if (avatarEl && userProfile?.avatar_url) avatarEl.src = userProfile.avatar_url;

  // Fire event
  window.dispatchEvent(new Event('userLoaded'));

  // Load unread badges
  loadUnreadBadges();
})();

async function loadUnreadBadges() {
  if (!currentUser) return;

  const { count: unreadMsgs } = await supabaseClient
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', currentUser.id)
    .eq('is_read', false);

  const { count: unreadNotifs } = await supabaseClient
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)
    .eq('is_read', false);

  const msgBadge = document.getElementById('msgBadge');
  if (msgBadge) {
    msgBadge.textContent = unreadMsgs || 0;
    msgBadge.style.display = (unreadMsgs > 0) ? 'inline-block' : 'none';
  }

  const notifBadge = document.getElementById('notifBadge');
  if (notifBadge) {
    notifBadge.textContent = unreadNotifs || 0;
    notifBadge.style.display = (unreadNotifs > 0) ? 'inline-block' : 'none';
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('mainContent');
  const btn = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('overlay');

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  } else {
    sidebar.classList.toggle('hidden');
    main.classList.toggle('full');
    btn.classList.toggle('shifted');
  }
}

function closeSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('sidebarToggle');
  if (btn && window.innerWidth > 768) btn.classList.add('shifted');
});
