async function registerAdmin(){
  const nama = document.getElementById('nama').value
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  await supabaseClient
    .from('users')
    .insert([{
      nama:nama,
      email:email,
      password:password,
      role:'admin'
    }])

  alert('Admin berhasil dibuat')
  window.location.href = 'login.html'
}
