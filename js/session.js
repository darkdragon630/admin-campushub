async function checkSession(){
  const ssid = localStorage.getItem('ssid')

  if(!ssid){
    window.location.href = 'login.html'
    return
  }

  const { data } = await supabaseClient
    .from('users')
    .select('*')
    .eq('ssid', ssid)
    .single()

  if(!data){
    window.location.href = 'login.html'
    return
  }

  const now = new Date()
  const expired = new Date(data.expired_at)

  if(now > expired){
    localStorage.removeItem('ssid')
    window.location.href = 'login.html'
  }
}

checkSession()
