const [activationCode, setActivationCode] = useState('') // Replaces 'pin'

  const handleClaim = async () => {
    // Check for the 8-character code
    if (!activationCode || activationCode.length < 6) {
      return setStatus("Please enter your full Activation Code.")
    }

    setStatus("Verifying Activation Code & configuring hardware...")
    const { data: { user } } = await supabase.auth.getUser()

    // 🔥 STEP 1: Fetch customer profile for username generation
    const { data: profile } = await supabase
      .from('customers')
      .select('username, display_name')
      .eq('id', user.id)
      .single()

    let finalUsername = profile?.username

    // 🔥 STEP 2: Auto-Generate Username (If they don't have one)
    if (!finalUsername) {
      const fullName = profile?.display_name || user?.email?.split('@')[0] || 'User'
      const nameParts = fullName.split(' ')
      
      const firstLetter = nameParts[0].charAt(0)
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
      const randomChars = Math.random().toString(36).substring(2, 5) 

      finalUsername = `${firstLetter}${lastName}${randomChars}`.toLowerCase().replace(/[^a-z0-9]/g, '')

      await supabase
        .from('customers')
        .update({ username: finalUsername })
        .eq('id', user.id)
    }

    // 🔥 STEP 3: THE VAULT DOOR - Check the Activation Code
    const newTargetUrl = `https://linksupply.co.uk/u/${finalUsername}`

    const { error, data } = await supabase
      .from('nfc_stickers') // Or whatever your exact table name is
      .update({ 
        owner_id: user.id,
        target_url: newTargetUrl 
      })
      .eq('url_slug', stickerId) // Matches the 'd0b52053' from the URL
      .eq('activation_code', activationCode.toUpperCase()) // Matches 'DEF9BFC0'
      .is('owner_id', null) 
      .select()

    if (error || !data || data.length === 0) {
      setStatus("Error: Invalid Activation Code or this item is already claimed.")
    } else {
      setStatus("Success! Item secured and linked. Taking you to your dashboard...")
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  // ... (Inside your return statement, update the input field) ...

      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          maxLength="8"
          placeholder="e.g. DEF9BFC0" 
          value={activationCode}
          onChange={(e) => setActivationCode(e.target.value.toUpperCase())} // Auto-formats to uppercase
          style={{ 
            padding: '12px', 
            width: '200px', 
            textAlign: 'center', 
            fontSize: '18px', 
            letterSpacing: '2px',
            color: 'black',
            borderRadius: '5px',
            border: 'none',
            textTransform: 'uppercase'
          }}
        />
      </div>
