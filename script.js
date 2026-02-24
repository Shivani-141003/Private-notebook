// --- INITIALIZATION ---
const supabaseUrl = "https://lsmhxmxfrnwsanqxzymo.supabase.co";
const supabaseKey = "sb_publishable_Flv4bGGj8Avhz2leWUJ_IA_qxwuEkKU";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- AUTHENTICATION ---

// Optimized Google Sign-In with clean redirect handling
window.signInWithGoogle = async function () {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { 
            redirectTo: window.location.origin + window.location.pathname 
        }
    });
    if (error) console.error("Login Error:", error.message);
};

// Email/Password Login & Sign-up Logic
window.validateForm = async function(event) {
    if (event) event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    if (!email || !password) {
        message.style.color = "red";
        message.innerText = "Please enter email and password.";
        return false;
    }

    // Try login
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        // If login fails, attempt to create a new account
        const { error: signUpError } = await supabaseClient.auth.signUp({ email, password });
        if (signUpError) {
            message.style.color = "red";
            message.innerText = signUpError.message;
        } else {
            message.style.color = "green";
            message.innerText = "Account created! Check your email to verify.";
        }
    } else {
        message.style.color = "green";
        message.innerText = "Login successful!";
        setTimeout(() => location.reload(), 500);
    }
    return false;
};

window.signOut = async function () {
    await supabaseClient.auth.signOut();
    location.reload();
};

function updateUI(session) {
    const loginForm = document.getElementById("login-form");
    const profileCard = document.getElementById("profile-card");

    if (session) {
        if (loginForm) loginForm.style.display = "none";
        if (profileCard) profileCard.style.display = "block";
        
        const user = session.user;
        document.getElementById("user-name").innerText = "Hello, " + (user.user_metadata.full_name || "User");
        document.getElementById("user-email").innerText = user.email;
        document.getElementById("user-avatar").src = user.user_metadata.avatar_url || "https://via.placeholder.com/80";
        loadNotes();
    } else {
        if (loginForm) loginForm.style.display = "block";
        if (profileCard) profileCard.style.display = "none";
    }
}

// --- NOTE MANAGEMENT ---

window.saveNote = async function () {
    const content = document.getElementById("note-content").value;
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!content || !user) return;

    const { error } = await supabaseClient
        .from("Notes")
        .insert([{ Content: content, user_id: user.id }]);

    if (!error) {
        document.getElementById("note-content").value = "";
        loadNotes();
    }
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
        list.innerHTML = notes.map(n => {
            // FIX: Safely handling the date to avoid "Invalid Date"
            const rawDate = n.created_at ? new Date(n.created_at) : null;
            const dateStr = (rawDate && !isNaN(rawDate)) ? rawDate.toLocaleDateString() : "Just now";

            return `
                <div style="background: #fff; padding: 15px; border-radius: 12px; margin-top: 10px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.03);">
                    <div style="flex: 1; text-align: left;">
                        <span style="display: block; font-size: 15px; color: #333;">${n.Content}</span>
                        <small style="color: #aaa; font-size: 10px;">📅 ${dateStr}</small>
                    </div>
                    <button onclick="deleteNote(${n.id})" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 18px; padding: 5px 10px;">✖</button>
                </div>
            `;
        }).join('');
    }
}

window.deleteNote = async function (id) {
    if (confirm("Delete this note?")) {
        await supabaseClient.from("Notes").delete().eq("id", id);
        loadNotes();
    }
};

// --- INITIAL LOAD ---
window.addEventListener("load", async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    updateUI(session);
});