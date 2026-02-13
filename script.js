// --- INITIALIZATION ---
const supabaseUrl = "https://lsmhxmxfrnwsanqxzymo.supabase.co";
const supabaseKey = "sb_publishable_Flv4bGGj8Avhz2leWUJ_IA_qxwuEkKU";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- AUTHENTICATION ---

function updateUI(session) {
    const loginForm = document.getElementById("login-form");
    const profileCard = document.getElementById("profile-card");

    if (session) {
        if (loginForm) loginForm.style.display = "none";
        if (profileCard) profileCard.style.display = "block";

        const user = session.user;
        document.getElementById("user-name").innerText = "Hello, " + (user.user_metadata.full_name || "User");
        document.getElementById("user-email").innerText = user.email;
        document.getElementById("user-avatar").src = user.user_metadata.avatar_url || "https://via.placeholder.com/100";

        loadNotes(); // Load notes once user is logged in
    } else {
        if (loginForm) loginForm.style.display = "block";
        if (profileCard) profileCard.style.display = "none";
    }
}

window.signInWithGoogle = async function () {
    await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href }
    });
};

window.signOut = async function () {
    await supabaseClient.auth.signOut();
    window.location.reload();
};

// --- NOTE MANAGEMENT ---

async function saveNote() {
    const content = document.getElementById("note-content").value;
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!content) return alert("Please enter some text!");

    const { error } = await supabaseClient
        .from('Notes')
        .insert([{ 
            Content: content, 
            "user id": user.id // Using the correct column name with space
        }]);

    if (error) {
        console.error("Error saving:", error);
    } else {
        document.getElementById("note-content").value = "";
        loadNotes();
    }
}

async function loadNotes() {
    const { data: notes, error } = await supabaseClient
        .from('Notes')
        .select('*')
        .order('id', { ascending: false });

    const list = document.getElementById("notes-list");
    if (notes && list) {
        list.innerHTML = notes.map(n => {
            
            // Format the date from your new 'create_at' column
            const dateStr = n.create_at ? new Date(n.create_at).toLocaleDateString() : "Just now";
            
            return `
            <div style="background: #f9f9f9; padding: 12px; border-radius: 8px; margin-top: 10px; border-left: 5px solid #28a745; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div>
                    <span style="color: #333; display: block;">${n.Content}</span>
                    <small style="color: #888; font-size: 10px;">Created: ${dateStr}</small>
                </div>
                <button onclick="deleteNote(${n.id})" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 18px; font-weight: bold;">&times;</button>
            </div>
        `}).join('');
    }
}

window.deleteNote = async function (id) {
    if (confirm("Delete this note?")) {
        const { error } = await supabaseClient
            .from('Notes')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Error deleting note: " + error.message);
        } else {
            loadNotes();
        }
    }
};

// --- PAGE LOAD ---

window.addEventListener("load", async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    updateUI(session);
});