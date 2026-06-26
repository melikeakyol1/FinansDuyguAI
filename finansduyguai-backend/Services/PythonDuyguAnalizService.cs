using FinansalAnaliz.DTOs;
using System.Net.Http.Json;

namespace FinansalAnaliz.Services
{
    public class PythonDuyguAnalizService
    {
        private readonly HttpClient _httpClient;

        public PythonDuyguAnalizService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<DuyguAnalizSonucuDto?> AnalizEtAsync(string? aciklama)
        {
            if (string.IsNullOrWhiteSpace(aciklama))
            {
                return new DuyguAnalizSonucuDto
                {
                    MetinDuygusu = "neutral",
                    GuvenSkoru = 0
                };
            }

            var response = await _httpClient.PostAsJsonAsync(
                "http://127.0.0.1:8001/duygu-analiz",
                new { text = aciklama }
            );

            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<DuyguAnalizSonucuDto>();
        }
    }
}