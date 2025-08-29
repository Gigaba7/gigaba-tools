$(function (){
    console.log('BingoSheet.js');

    // 各セットの画像枚数（必要に応じて変更）
    const setImageCounts = {
        2: 228,
        3: 262,
        4: 263,
        5: 296
    };

    // 使用する画像ファイル配列
    let currentImageFiles = [];

    // 画像ファイル名から数字を抽出する関数
    function extractImageNumber(filename) {
        console.log('extractImageNumber called with filename:', filename);
        
        // ファイル名から数字部分を抽出（例：img/img2/0.png → 0, img/img2/21.png → 21）
        const match = filename.match(/(\d+)\.png$/);
        console.log('Regex match result:', match);
        
        if (match) {
            const number = parseInt(match[1], 10);
            // 現在選択されているセット番号を取得
            const currentSet = parseInt($('#image-array-select').val(), 10);
            console.log('Current set:', currentSet, 'Extracted number:', number);

            // img5の場合は連番数字+0、それ以外は連番数字+1
            if (currentSet === 5) {
                const result = number + 0; // img5の場合はそのまま
                console.log('Set 5, returning:', result);
                return result;
            } else {
                const result = number + 1; // img2,3,4の場合は+1
                console.log('Set 2,3,4, returning:', result);
                return result;
            }
        }
        console.log('No match found, returning 0');
        return 0; // デフォルト値
    }

    // 画像配列を選択する関数
    function selectImageArray(setNumber) {
        // 数値に変換
        const num = parseInt(setNumber, 10);
        // セットに対応する画像枚数を取得
        const count = setImageCounts[num] || setImageCounts[2]; // デフォルトはセット2

        // img/img{setNumber}/0.png ～ count-1.png を生成
        // img5の場合は1.pngから開始
        if (num === 5) {
            currentImageFiles = Array.from(
                { length: count },
                (_, i) => `img/img${num}/${i + 1}.png`
            );
        } else {
            currentImageFiles = Array.from(
                { length: count },
                (_, i) => `img/img${num}/${i}.png`
            );
        }

        console.log(`画像セット${setNumber}を選択しました (合計: ${currentImageFiles.length}枚)`);
        console.log('生成されたファイルパス:', currentImageFiles.slice(0, 5)); // 最初の5件を表示
        
        // デバッグ用：最初の10件のファイル名を詳細表示
        console.log('最初の10件のファイル名詳細:');
        currentImageFiles.slice(0, 10).forEach((filename, index) => {
            console.log(`  ${index}: ${filename}`);
        });

        clearAllChoices();
        validateImageFiles();
    }

    // 画像配列選択プルダウンのイベントハンドラー
    $('#image-array-select').on('change', function() {
        const selectedSet = $(this).val();
        selectImageArray(selectedSet);
    });

    // 画像ファイルの存在確認関数
    function validateImageFiles() {
        const validImages = [];
        const missingImages = [];

        // 画像ファイルの存在確認（非同期で処理）
        const checkImage = (filename) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    validImages.push(filename);
                    resolve(true);
                };
                img.onerror = () => {
                    missingImages.push(filename);
                    console.warn(`画像ファイルが見つかりません: ${filename}`);
                    resolve(false);
                };
                img.src = `./${filename}`;
            });
        };

        // すべての画像を並行してチェック
        const checkPromises = currentImageFiles.map(checkImage);

        Promise.all(checkPromises).then(() => {
            console.log(`有効な画像: ${validImages.length}枚, 見つからない画像: ${missingImages.length}枚`);

            // 有効な画像のみで配列を更新
            if (validImages.length > 0) {
                currentImageFiles = validImages;
                console.log('currentImageFilesが更新されました:', currentImageFiles.length);
            } else {
                console.error('有効な画像ファイルが見つかりません');
                alert('画像ファイルが見つかりません。imgフォルダを確認してください。');
            }
        });
    }

    // 堅牢な入力値検証関数
    function validateInput(inputId, min, max) {
        const value = $(`#${inputId}`).val();
        const numValue = parseInt(value);

        if (isNaN(numValue) || numValue < min || numValue > max) {
            return null;
        }
        return numValue;
    }

    // ビンゴシートのサイズ
    const BINGO_SIZE = 5;
    const TOTAL_CELLS = BINGO_SIZE * BINGO_SIZE - 1; // FREEマスを除く

    // 完成済みのBINGOラインを記録
    let completedBingoLines = {
        rows: new Set(),
        cols: new Set(),
        diagonals: new Set() // 0: 左上から右下, 1: 右上から左下
    };

    // ビンゴシート外の選択（画像のみ）を保持するセット（ファイル名フルパス相対）
    const externalSelectedImages = new Set();

    // 生成ボタンのクリックイベント
    $('#generate-btn').on('click', function() {
        clearAllChoices();
        generateBingoSheet();
    });

    // すべて解除ボタンのクリックイベント
    $('#clear-all-btn').on('click', function() {
        clearAllChoices();
    });

    // ランダム解除ボタンのクリックイベント
    $('#random-clear-btn').on('click', function() {
        const count = validateInput('random-clear-count', 1, 20);
        if (count !== null) {
            randomClearChoices(count);
        } else {
            alert('1から20の範囲で有効な数値を入力してください');
        }
    });

    // ランダム選択ボタンのクリックイベント
    $('#random-select-btn').on('click', function() {
        const count = validateInput('random-select-count', 1, 20);
        if (count !== null) {
            randomSelectChoices(count);
        } else {
            alert('1から20の範囲で有効な数値を入力してください');
        }
    });

    // ビンゴシート生成関数
    function generateBingoSheet() {
        // 画像ファイルが不足している場合のチェック
        if (currentImageFiles.length < TOTAL_CELLS) {
            console.warn(`画像ファイルが不足しています。必要: ${TOTAL_CELLS}枚, 利用可能: ${currentImageFiles.length}枚`);

            // 利用可能な画像が0枚の場合は処理を停止
            if (currentImageFiles.length === 0) {
                alert('利用可能な画像ファイルがありません。画像セットを確認してください。');
                return;
            }

            // 利用可能な画像が少ない場合は警告を表示
            if (currentImageFiles.length < TOTAL_CELLS) {
                alert(`画像ファイルが不足しています。\n必要: ${TOTAL_CELLS}枚\n利用可能: ${currentImageFiles.length}枚\n\n利用可能な画像のみでビンゴシートを生成します。`);
            }
        }

        // 既存の画像をクリア（FREEマス以外）
        $('.bingo-cell:not(.free-cell)').empty();

        // 選択状態をクリア
        $('.bingo-cell:not(.free-cell)').removeAttr('data-choice');

        // 選択肢ツールチップを再追加
        $('.bingo-cell:not(.free-cell)').each(function() {
            const tooltip = $(`
                <div class="choice-tooltip">
                    <div class="choice-option select">選択</div>
                    <div class="choice-option unselect">解除</div>
                </div>
            `);
            $(this).append(tooltip);
        });

        // 画像ファイルをシャッフル
        const shuffledImages = shuffleArray([...currentImageFiles]);

        // 利用可能な画像数に基づいて、実際に配置するマス数を決定
        const availableImages = Math.min(shuffledImages.length, TOTAL_CELLS);
        const selectedImages = shuffledImages.slice(0, availableImages);

        // 現在選択されているセット番号を取得
        const currentSet = $('#image-array-select').val();

        // 各マスに画像を配置
        let imageIndex = 0;
        $('.bingo-cell:not(.free-cell)').each(function() {
            if (imageIndex < selectedImages.length) {
                const imgPath = `./${selectedImages[imageIndex]}`;

                const img = $('<img>', {
                    src: imgPath,
                    alt: `Bingo Image ${imageIndex + 1}`,
                    title: selectedImages[imageIndex]
                });

                // 画像読み込みエラー時の処理
                img.on('error', function() {
                    $(this).replaceWith(`<div class="image-placeholder">${selectedImages[imageIndex]}</div>`);
                });

                // 画像ファイル名から数字を抽出して画像番号を計算
                const imageNumber = extractImageNumber(selectedImages[imageIndex]);
                console.log(`Image ${imageIndex}: filename="${selectedImages[imageIndex]}", extracted number=${imageNumber}`);
                $(this).attr('data-image-number', imageNumber);

                // ツールチップに画像番号を設定
                $(this).find('.choice-tooltip').attr('data-image-number', imageNumber);

                $(this).append(img);
                imageIndex++;
            } else {
                // 画像が不足している場合はプレースホルダーを表示
                $(this).append(`<div class="image-placeholder">画像不足</div>`);

                // 画像が不足しているマスは選択不可にする
                $(this).find('.choice-tooltip').remove();
                $(this).addClass('disabled-cell');
            }
        });

        // 選択済み画像リストを更新
        updateSelectedImagesList();
    }

    // 選択済み画像リストを更新する関数
    function updateSelectedImagesList() {
        const container = $('#selected-images-container');
        const selectedCells = $('.bingo-cell[data-choice="select"]:not(.free-cell)');

        // コンテナをクリア
        container.empty();

        // まずはビンゴシート上の選択を表示
        selectedCells.each(function() {
            const cell = $(this);
            const img = cell.find('img');
            const imageNumber = cell.attr('data-image-number');
            const listItem = $(`
                <div class="selected-image-item" data-source="cell" data-row="${cell.data('row')}" data-col="${cell.data('col')}">
                    ${img.length > 0 ? `<img src="${img.attr('src')}" alt="選択済み画像">` : ''}
                    <div class="selected-image-info">
                        <div class="selected-image-number">No.${imageNumber}</div>
                    </div>
                    <button class="remove-selection-btn" title="選択解除">×</button>
                </div>
            `);

            // 選択解除ボタン（セル由来）
            listItem.find('.remove-selection-btn').on('click', function() {
                cell.removeAttr('data-choice');
                cell.removeAttr('data-image-number');
                updateSelectedImagesList();
                checkBingo();
            });

            container.append(listItem);
        });

        // 次に、外部選択（ビンゴシート外）を表示
        const externalList = Array.from(externalSelectedImages);
        externalList.forEach((filename) => {
            const imageNumber = extractImageNumber(filename);
            const listItem = $(`
                <div class="selected-image-item" data-source="external" data-filename="${filename}">
                    <img src="./${filename}" alt="選択済み画像">
                    <div class="selected-image-info">
                        <div class="selected-image-number">No.${imageNumber}</div>
                    </div>
                    <button class="remove-selection-btn" title="選択解除">×</button>
                </div>
            `);

            // 選択解除ボタン（外部リスト由来）
            listItem.find('.remove-selection-btn').on('click', function() {
                externalSelectedImages.delete(filename);
                updateSelectedImagesList();
            });

            container.append(listItem);
        });

        // 何もなければメッセージ表示
        if (selectedCells.length === 0 && externalList.length === 0) {
            container.append('<p class="no-selection-message">まだ画像が選択されていません</p>');
        }
    }

    // 配列をシャッフルする関数（Fisher-Yatesアルゴリズム）
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // すべての選択状態を一斉に解除する関数
    function clearAllChoices() {
        // すべてのマスから選択状態を削除
        $('.bingo-cell:not(.free-cell)').removeAttr('data-choice');
        externalSelectedImages.clear();

        // 選択済み画像リストを更新
        updateSelectedImagesList();

        console.log('すべての選択状態が解除されました');
    }

    // ランダムで指定した数のマスを選択解除する関数
    function randomClearChoices(count) {
        // 選択済み（セル選択＋外部選択）の両方から解除対象を抽出
        const selectedCells = $('.bingo-cell:not(.free-cell)[data-choice="select"]');
        const externalList = Array.from(externalSelectedImages).map((f) => ({ type: 'external', filename: f }));
        const cellList = selectedCells.toArray().map((el) => ({ type: 'cell', cell: $(el) }));
        const combined = cellList.concat(externalList);

        if (combined.length === 0) {
            alert('選択済みリストに項目がありません');
            return;
        }

        const actualCount = Math.min(count, combined.length);
        const shuffled = shuffleArray(combined);

        let clearedCells = 0;
        let clearedExternal = 0;
        for (let i = 0; i < actualCount; i++) {
            const item = shuffled[i];
            if (item.type === 'cell') {
                item.cell.removeAttr('data-choice');
                item.cell.removeAttr('data-image-number');
                clearedCells++;
            } else {
                externalSelectedImages.delete(item.filename);
                clearedExternal++;
            }
        }

        updateSelectedImagesList();
        console.log(`解除: セル${clearedCells}件 / 外部${clearedExternal}件`);
    }

    function randomSelectChoices(count) {
        if (currentImageFiles.length === 0) {
            alert('画像ファイルが読み込まれていません');
            return;
        }

        // 現在選択済みのファイル名を取得（ビンゴシート + 外部選択）
        const selectedFilenames = new Set();

        // ビンゴシート上の選択
        $('.bingo-cell:not(.free-cell)[data-choice="select"]').each(function () {
            const img = $(this).find('img');
            if (img.length > 0) {
                selectedFilenames.add(img.attr('title')); // title 属性にファイル名が入っている
            }
        });

        // 外部選択されたファイル名
        for (const filename of externalSelectedImages) {
            selectedFilenames.add(filename);
        }

        // 未選択の画像だけを抽出
        const unselectedCandidates = currentImageFiles.filter(file => !selectedFilenames.has(file));

        if (unselectedCandidates.length === 0) {
            alert('選択可能な未使用画像がありません');
            return;
        }

        const actualCount = Math.min(count, unselectedCandidates.length);
        const shuffled = shuffleArray(unselectedCandidates);

        let markedCells = 0;
        for (let i = 0; i < actualCount; i++) {
            const filename = shuffled[i];

            // ビンゴシート上に画像があるか確認（titleで検索）
            const targetImg = $(`.bingo-cell:not(.free-cell) img[title="${filename}"]`).first();

            if (targetImg.length > 0) {
                const cell = targetImg.closest('.bingo-cell');
                const imageNumber = extractImageNumber(filename);
                cell.attr('data-image-number', imageNumber);
                cell.find('.choice-tooltip').attr('data-image-number', imageNumber);
                cell.attr('data-choice', 'select');
                markedCells++;
            } else {
                // 外部選択リストに追加
                externalSelectedImages.add(filename);
            }
        }

        updateSelectedImagesList();
        console.log(`${actualCount}件選定（セル選択: ${markedCells}件 / 外部追加: ${actualCount - markedCells}件）`);

        checkBingo();
    }

    // ビンゴ判定関数
    function checkBingo() {
        const bingoSize = 5;
        let bingoLines = 0;

        // 行のチェック
        for (let row = 0; row < bingoSize; row++) {
            // すでに完成済みの行はスキップ
            if (completedBingoLines.rows.has(row)) continue;

            let rowCount = 0;
            let hasFreeCell = false;

            for (let col = 0; col < bingoSize; col++) {
                const cell = $(`.bingo-cell[data-row="${row}"][data-col="${col}"]`);
                if (cell.hasClass('free-cell')) {
                    hasFreeCell = true; // この行にFREEマスがある
                } else if (cell.attr('data-choice') === 'select') {
                    rowCount++;
                }
            }

            // FREEマスがある場合は4つ、ない場合は5つでBINGO達成
            const requiredCount = hasFreeCell ? 4 : 5;
            if (rowCount >= requiredCount) {
                bingoLines = 1; // 1ラインで終了
                // 完成した行を記録
                completedBingoLines.rows.add(row);
                break;
            }
        }

        // 1ライン達成していない場合のみ列と対角線をチェック
        if (bingoLines === 0) {
            // 列のチェック
            for (let col = 0; col < bingoSize; col++) {
                // すでに完成済みの列はスキップ
                if (completedBingoLines.cols.has(col)) continue;

                let colCount = 0;
                let hasFreeCell = false;

                for (let row = 0; row < bingoSize; row++) {
                    const cell = $(`.bingo-cell[data-row="${row}"][data-col="${col}"]`);
                    if (cell.hasClass('free-cell')) {
                        hasFreeCell = true; // この列にFREEマスがある
                    } else if (cell.attr('data-choice') === 'select') {
                        colCount++;
                    }
                }

                // FREEマスがある場合は4つ、ない場合は5つでBINGO達成
                const requiredCount = hasFreeCell ? 4 : 5;
                if (colCount >= requiredCount) {
                    bingoLines = 1; // 1ラインで終了
                    // 完成した列を記録
                    completedBingoLines.cols.add(col);
                    break;
                }
            }
        }

        // 1ライン達成していない場合のみ対角線をチェック
        if (bingoLines === 0) {
            // 対角線のチェック（左上から右下）
            if (!completedBingoLines.diagonals.has(0)) {
                let diagonal1Count = 0;
                let hasFreeCell = false;

                for (let i = 0; i < bingoSize; i++) {
                    const cell = $(`.bingo-cell[data-row="${i}"][data-col="${i}"]`);
                    if (cell.hasClass('free-cell')) {
                        hasFreeCell = true; // この対角線にFREEマスがある
                    } else if (cell.attr('data-choice') === 'select') {
                        diagonal1Count++;
                    }
                }

                // FREEマスがある場合は4つ、ない場合は5つでBINGO達成
                const requiredCount = hasFreeCell ? 4 : 5;
                if (diagonal1Count >= requiredCount) {
                    bingoLines = 1; // 1ラインで終了
                    // 完成した対角線を記録
                    completedBingoLines.diagonals.add(0);
                }
            }
        }

        // 1ライン達成していない場合のみ2番目の対角線をチェック
        if (bingoLines === 0) {
            // 対角線のチェック（右上から左下）
            if (!completedBingoLines.diagonals.has(1)) {
                let diagonal2Count = 0;
                let hasFreeCell = false;

                for (let i = 0; i < bingoSize; i++) {
                    const cell = $(`.bingo-cell[data-row="${i}"][data-col="${4-i}"]`);
                    if (cell.hasClass('free-cell')) {
                        hasFreeCell = true; // この対角線にFREEマスがある
                    } else if (cell.attr('data-choice') === 'select') {
                        diagonal2Count++;
                    }
                }

                // FREEマスがある場合は4つ、ない場合は5つでBINGO達成
                const requiredCount = hasFreeCell ? 4 : 5;
                if (diagonal2Count >= requiredCount) {
                    bingoLines = 1; // 1ラインで終了
                    // 完成した対角線を記録
                    completedBingoLines.diagonals.add(1);
                }
            }
        }

        // ビンゴラインが1つある場合、ポップアップを表示
        if (bingoLines > 0) {
            showBingoPopup();
        }
    }

    // ビンゴポップアップを表示
    function showBingoPopup() {
        const popup = $('#bingo-popup');
        const bingoText = popup.find('.bingo-text');
        const subtitle = popup.find('.bingo-subtitle');

        // FREEマスがあるので4つでBINGO達成
        bingoText.text('BINGO!');
        popup.addClass('show');
    }

    // ゲームを続ける機能
    function continueGame() {
        // ポップアップを非表示
        hideBingoPopup();

        console.log('ゲームを続行します');
    }

    // ゲームリセット機能
    function resetGame() {
        // ポップアップを非表示
        hideBingoPopup();

        // すべての選択状態をクリア
        clearAllChoices();

        // 完成済みのBINGOライン記録をクリア
        completedBingoLines.rows.clear();
        completedBingoLines.cols.clear();
        completedBingoLines.diagonals.clear();

        // ビンゴシートを再生成
        generateBingoSheet();

        console.log('ゲームがリセットされました');
    }

    // ビンゴポップアップを非表示
    function hideBingoPopup() {
        $('#bingo-popup').removeClass('show');
    }

    // 初期化時にビンゴシートを生成
    // デフォルトで画像セット2を選択
    selectImageArray('2');
    generateBingoSheet();

    // 選択肢のクリックイベント
    $(document).on('click', '.choice-option', function(e) {
        e.stopPropagation();
        const cell = $(this).closest('.bingo-cell');

        // クラスから選択状態を判定（テキストではなくクラス名で統一）
        const choiceKey = $(this).hasClass('select') ? 'select' : 'unselect';

        // 選択状態を保存
        cell.attr('data-choice', choiceKey);

        // 選択済み画像リストを更新
        updateSelectedImagesList();

        console.log(`マス (${cell.data('row')}, ${cell.data('col')}) で ${choiceKey} が選択されました`);

        // ビンゴ判定を実行（1ラインで終了）
        checkBingo();
    });

    // 「もう一度遊ぶ」ボタンのクリックイベント
    $('#play-again-btn').on('click', function() {
        resetGame();
    });

    // 「続ける」ボタンのクリックイベント
    $('#continue-btn').on('click', function() {
        continueGame();
    });

});