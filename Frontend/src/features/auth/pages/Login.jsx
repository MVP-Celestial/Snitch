import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../hook/useAuth'

function Login() {
  const { handleLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleChange = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await handleLogin(form)
      navigate('/')
    } catch {
      setError('We could not sign you in. Please check your details and try again.')
    }
  }

  return <main className="min-h-screen overflow-x-hidden bg-[#f5f1eb] p-0 md:h-screen md:overflow-hidden md:p-[30px]"><div className="mx-auto grid min-h-screen max-w-[1320px] overflow-hidden bg-[#fffdfa] shadow-[0_18px_60px_#574b3d12] md:h-[calc(100vh-60px)] md:min-h-0 md:grid-cols-[.91fr_1.09fr]">
    <section className="relative flex min-h-[420px] flex-col justify-between overflow-hidden bg-[#2d2b28] p-[30px] text-[#f8f2e9] after:absolute after:-bottom-[150px] after:-right-[135px] after:h-[380px] after:w-[380px] after:rounded-full after:border after:border-[#d7795c66] after:shadow-[0_0_0_38px_#d7795c0e,0_0_0_76px_#d7795c0e,0_0_0_114px_#d7795c0e] md:min-h-0 md:p-12"><a className="relative z-10 inline-flex w-fit items-center gap-[11px] text-[21px] font-semibold tracking-[-.04em]" href="/"><span className="grid h-7 w-7 place-items-center rounded-full border border-[#e3a28c] font-serif text-lg italic font-normal text-[#e3a28c]">S</span><span>stitch</span></a><div className="relative z-10 my-auto py-[55px] md:py-[100px]"><p className="mb-5 text-[11px] font-semibold uppercase tracking-[.17em] text-[#d89a83]">Welcome back</p><h1 className="mb-7 text-[52px] font-medium leading-[.98] tracking-[-.07em] md:text-[clamp(46px,5vw,74px)]">Good to<br /><em className="font-serif font-medium tracking-[-.06em] text-[#e3a28c]">see you again.</em></h1><p className="mb-0 max-w-[270px] text-sm leading-[1.65] text-[#c5bdb3]">Your considered wardrobe is waiting. Pick up where you left off.</p></div><div className="relative z-10 flex items-center gap-[15px] text-[10px] tracking-[.1em] text-[#9e958b]"><span>01</span><span className="h-px w-[50px] bg-[#8b8279]" /><span>02</span></div></section>
    <section className="flex flex-col justify-center px-[30px] py-[50px] sm:px-10 md:px-[clamp(40px,8vw,125px)] md:py-17.5"><div className="mb-10.5"><p className="mb-5 text-[11px] font-semibold uppercase tracking-[.17em] text-[#bb806b]">Welcome back</p><h2 className="mb-2 text-[30px] font-medium tracking-[-.045em]">Sign in to Stitch</h2><p className="m-0 text-[13px] text-[#8b847c]">New to Stitch? <a className="text-[#bb6049] underline-offset-4" href="/register">Create an account</a></p></div><form className="grid gap-[25px]" onSubmit={handleSubmit}>
      <label className="relative grid gap-[9px] text-[11px] font-semibold tracking-[.04em] text-[#77716a]"><span>Email address</span><input className="w-full border-0 border-b border-[#dcd7d0] bg-transparent pb-[11px] text-sm text-[#2d2b28] outline-none placeholder:text-[#b6b0a8] focus:border-[#c66d55]" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required /></label>
      <label className="relative grid gap-[9px] text-[11px] font-semibold tracking-[.04em] text-[#77716a]"><span>Password</span><input className="w-full border-0 border-b border-[#dcd7d0] bg-transparent pb-[11px] pr-11 text-sm text-[#2d2b28] outline-none placeholder:text-[#b6b0a8] focus:border-[#c66d55]" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Your password" required /><button type="button" className="absolute bottom-[10px] right-0 border-0 bg-transparent p-0 text-[11px] text-[#bb6049]" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button></label>
      <div className="-mt-3 flex justify-end"><a className="text-[11px] text-[#bb6049] underline-offset-4" href="/forgot-password">Forgot password?</a></div>{error && <p className="-mt-3 mb-0 text-xs text-[#a95440]" role="alert">{error}</p>}<button className="mt-1 flex items-center justify-between border-0 bg-[#c66d55] px-5 py-4 text-[13px] font-semibold text-[#fffaf5] hover:bg-[#a95440]" type="submit">Sign in <span className="text-xl">→</span></button>
    </form></section>
  </div></main>
}

export default Login
