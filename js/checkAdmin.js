async function checkAdmin(){
  const { data } = await supabaseClient
    .from('users')
    .select('*')
    .eq('role', 'admin')

  if(data.length === 0){
    window.location.href = 'register.html'
  }else{
    window.location.href = 'login.html'
  }
}

checkAdmin()
