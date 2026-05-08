async function login(){
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  const { data } = await supabaseClient
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single()

  if(data){
    const ssid = Math.random().toString(36).substring(2)

    const expired = new Date()
    expired.setHours(expired.getHours() + 24)

    await supabaseClient
      .from('users')
      .update({
        ssid:ssid,
        expired_at:expired
      })
      .eq('id', data.id)

    localStorage.setItem('ssid', ssid)

    window.location.href = 'dashboard.html'
  }else{
    alert('Login gagal')
  }
}
