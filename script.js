const supabaseUrl = "https://lsmhxmxfrnwsanqxzymo.supabase.co";
const supabaseKey = "sb_publishable_Flv4bGGj8Avhz2leWUJ_IA_qxwuEkKU";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

window.signInWithGoogle = async function () {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { 
            // FIXED: Using standard window location for cleaner redirects
            redirectTo: window.location.origin + window.location.pathname 
        }
    });
    if (error) console.error("Login Error:", error.message);
};

window.signOut = async function () {
    await supabaseClient.auth.signOut();
    location.reload();
};

function updateUI(session) {
    const loginForm = document.getElementById("login-form");
    const profileCard = document.getElementById("profile-card");

    if (session) {
        loginForm.style.display = "none";
        profileCard.style.display = "block";
        const user = session.user;
        document.getElementById("user-name").innerText = "Hello, " + (user.user_metadata.full_name || "User");
        document.getElementById("user-email").innerText = user.email;
        document.getElementById("user-avatar").src = user.user_metadata.avatar_url;
        loadNotes();
    } else {
        loginForm.style.display = "block";
        profileCard.style.display = "none";
    }
}

window.saveNote = async function () {
    const content = document.getElementById("note-content").value;
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!content || !user) return;

    await supabaseClient.from("Notes").insert([{ Content: content, user_id: user.id }]);
    document.getElementById("note-content").value = "";
    loadNotes();
};

async function loadNotes() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data: notes } = await supabaseClient
        .from("Notes")
        .select("*")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

    const list = document.getElementById("notes-list");
    if (notes && list) {
        list.innerHTML = notes.map(n => `
            <div style="background: #fff; padding: 15px; border-radius: 12px; margin-top: 10px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <span style="display: block; font-size: 15px; color: #333;">${n.Content}</span>
                    <small style="color: #aaa; font-size: 10px;">📅 ${new Date(n.created_at).toLocaleDateString()}</small>
                </div>
                <button class="delete-btn" onclick="deleteNote(${n.id})">✖</button>
            </div>
        `).join('');
    }
}

window.deleteNote = async function (id) {
    if (confirm("Delete this note?")) {
        await supabaseClient.from("Notes").delete().eq("id", id);
        loadNotes();
    }
};

window.addEventListener("load", async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    updateUI(session);
});